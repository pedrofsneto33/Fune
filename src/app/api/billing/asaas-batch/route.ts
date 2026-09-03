import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';

interface BatchResult {
  contract_id: string;
  holder: string;
  status: 'created' | 'error' | 'skipped';
  asaas_payment_id?: string;
  amount?: number;
  due_date?: string;
  error?: string;
}

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // SECURITY: rate limit por usuario - operacao em lote de cobrancas reais
    const rl = checkRateLimit(`asabatch:${auth.userId}`, { maxAttempts: 3, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitos lotes em sequencia. Aguarde um minuto.' },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const billingType = ['PIX', 'BOLETO', 'UNDEFINED'].includes(body.billingType)
      ? body.billingType
      : 'BOLETO';

    // Data de vencimento: a informada no disparo ou dia 10 do mes seguinte
    let dueDate = '';
    if (body.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      dueDate = body.dueDate;
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(10);
      dueDate = d.toISOString().split('T')[0];
    }

    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);
    if (!asaasConfig.apiKey) {
      return NextResponse.json(
        { error: 'Chave de API do Asaas nao configurada para esta unidade. Configure em Configuracoes.' },
        { status: 400 },
      );
    }
    const { baseUrl, apiKey } = asaasConfig;

    const { data: contracts, error } = await supabaseAdmin
      .from('contracts')
      .select('id, holders(full_name, cpf, phone), plans(name, monthly_fee)')
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'active');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const results: BatchResult[] = [];

    const headers = { 'Content-Type': 'application/json', 'access_token': apiKey };

    for (const c of contracts || []) {
      const holder = (c as any).holders as any;
      const plan = (c as any).plans as any;
      const name = holder?.full_name || 'Associado';
      const cleanCpf = (holder?.cpf || '').replace(/\D/g, '');
      const amount = Number(plan?.monthly_fee) || 0;

      if (!cleanCpf || cleanCpf.length !== 11) {
        results.push({ contract_id: c.id, holder: name, status: 'skipped', error: 'CPF invalido ou ausente' });
        continue;
      }
      if (amount <= 0) {
        results.push({ contract_id: c.id, holder: name, status: 'skipped', error: 'Mensalidade do plano e zero' });
        continue;
      }

      try {
        // 1. Localiza ou cadastra o cliente no Asaas (por CPF)
        const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, {
          headers: { access_token: apiKey },
        });
        const searchData = await searchRes.json();
        let customerId = searchData?.data?.[0]?.id;
        if (!customerId) {
          const createRes = await fetch(`${baseUrl}/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name,
              cpfCnpj: cleanCpf,
              mobilePhone: holder?.phone ? holder.phone.replace(/\D/g, '') : undefined,
            }),
          });
          const createData = await createRes.json();
          if (createData.errors) {
            results.push({ contract_id: c.id, holder: name, status: 'error', error: 'Falha ao cadastrar cliente no Asaas' });
            continue;
          }
          customerId = createData.id;
        }

        // 2. Cria a cobranca no Asaas
        const paymentRes = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customer: customerId,
            billingType,
            value: amount,
            dueDate,
            description: `Mensalidade ${plan?.name || 'Plano'} - ${name}`,
            externalReference: c.id,
          }),
        });
        const paymentData = await paymentRes.json();
        if (paymentData.errors) {
          results.push({
            contract_id: c.id,
            holder: name,
            status: 'error',
            error: paymentData.errors?.[0]?.description || 'Falha na cobranca',
          });
          continue;
        }

        // 3. Registra localmente (webhook Asaas concilia o pagamento)
        await supabaseAdmin.from('payments').upsert(
          {
            tenant_id: auth.tenantId,
            contract_id: c.id,
            asaas_payment_id: paymentData.id,
            amount,
            due_date: dueDate,
            status: 'pending',
            payment_method: billingType === 'PIX' ? 'pix' : billingType === 'BOLETO' ? 'boleto' : null,
          },
          { onConflict: 'asaas_payment_id' },
        );

        results.push({
          contract_id: c.id,
          holder: name,
          status: 'created',
          asaas_payment_id: paymentData.id,
          amount,
          due_date: dueDate,
        });
      } catch (e: any) {
        results.push({ contract_id: c.id, holder: name, status: 'error', error: e?.message || 'Erro inesperado' });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    const failed = results.filter((r) => r.status === 'error').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      message: `Cobrancas ${billingType} no Asaas: ${created} criada(s), ${skipped} ignorada(s), ${failed} com erro. Vencimento: ${dueDate}.`,
      totalProcessed: created,
      created,
      failed,
      skipped,
      dueDate,
      billingType,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);