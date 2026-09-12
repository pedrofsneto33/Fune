import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID } from '@/lib/validation';
import { isHolderActive, isContractActive } from '@/lib/eligibility';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';
import { checkRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const withTimeout = (ms: number, promise: Promise<Response>) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao chamar o Asaas')), ms),
    ),
  ]);

// POST /api/billing/boleto — EMITE um boleto REAL no Asaas para um contrato
// ativo. Correção F-04: antes apenas inseria um payments pendente local, sem
// chamar o gateway — o associado nunca recebia o boleto. Agora: cliente no
// Asaas → cobrança BOLETO → registro local com asaas_payment_id (o webhook
// concilia o pagamento).
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const rl = checkRateLimit(`boleto:${auth.userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitos boletos em sequência. Aguarde um minuto.' },
        { status: 429 },
      );
    }

    const { contractId, amount, dueDate } = await req.json();
    if (!contractId || !amount) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }
    if (!isValidUUID(contractId)) {
      return NextResponse.json({ error: 'Contrato inválido.' }, { status: 400 });
    }
    const value = Number(amount);
    if (!value || value <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
    }
    const due = /^\d{4}-\d{2}-\d{2}$/.test(String(dueDate || ''))
      ? String(dueDate)
      : new Date().toISOString().split('T')[0];

    // Contrato + titular do tenant, com a regra única de elegibilidade
    const { data: contract, error: cErr } = await supabaseAdmin
      .from('contracts')
      .select('id, status, holders(full_name, cpf, phone, status), plans(name)')
      .eq('id', contractId)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle();
    if (cErr) {
      return NextResponse.json({ error: 'Erro ao localizar contrato.' }, { status: 500 });
    }
    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado para esta unidade.' }, { status: 404 });
    }
    const cStatus = ((contract as any).status ?? '').toLowerCase();
    const holder = (contract as any).holders;
    const hStatus = String(holder?.status ?? '').toLowerCase();
    if (!isContractActive(cStatus) || !isHolderActive(hStatus)) {
      return NextResponse.json(
        { error: 'Este contrato não está ativo ou o titular não está ativo. Reative o titular/contrato antes de gerar o boleto.' },
        { status: 403 },
      );
    }

    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);
    if (!asaasConfig.apiKey) {
      return NextResponse.json({ error: 'Chave do Asaas não configurada para esta unidade.' }, { status: 400 });
    }
    const { baseUrl, apiKey } = asaasConfig;
    const headers = { 'Content-Type': 'application/json', access_token: apiKey };

    // 1) Localiza/cria o cliente no Asaas (por CPF) — mesmo fluxo do lote
    const holderName = String(holder?.full_name || 'Associado');
    const cpf = String(holder?.cpf || '').replace(/\D/g, '');
    if (cpf.length !== 11) {
      return NextResponse.json(
        { error: 'Titular sem CPF válido. Complete o cadastro antes de gerar o boleto.' },
        { status: 400 },
      );
    }
    const searchRes = await withTimeout(
      15000,
      fetch(`${baseUrl}/customers?cpfCnpj=${cpf}`, { headers: { access_token: apiKey } }),
    );
    const searchData = await searchRes.json().catch(() => ({}));
    let customerId = searchData?.data?.[0]?.id;
    if (!customerId) {
      const createRes = await withTimeout(
        15000,
        fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: holderName,
            cpfCnpj: cpf,
            mobilePhone: holder?.phone ? String(holder.phone).replace(/\D/g, '') : undefined,
          }),
        }),
      );
      const createData = await createRes.json().catch(() => ({}));
      if (createData.errors || !createData.id) {
        return NextResponse.json(
          { error: 'Falha ao cadastrar cliente no Asaas: ' + (createData.errors?.[0]?.description || 'erro desconhecido') },
          { status: 400 },
        );
      }
      customerId = createData.id;
    }

    // 2) Cria o boleto no Asaas (externalReference rastreavel)
    const paymentRes = await withTimeout(
      15000,
      fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'BOLETO',
          value,
          dueDate: due,
          description: `Mensalidade ${(contract as any).plans?.name || 'Plano'} - ${holderName}`,
          externalReference: contractId,
        }),
      }),
    );
    const paymentData = await paymentRes.json().catch(() => ({}));
    if (paymentData.errors || !paymentData.id) {
      return NextResponse.json(
        { error: 'Falha ao gerar boleto no Asaas: ' + (paymentData.errors?.[0]?.description || 'erro desconhecido') },
        { status: 400 },
      );
    }

    // 3) Persiste localmente (o webhook concilia ao pagar). Falha aqui nao
    // desfaz a cobranca no Asaas — sinalizar explicitamente ao operador.
    const { data: localPayment, error: insertErr } = await supabaseAdmin
      .from('payments')
      .upsert(
        {
          tenant_id: auth.tenantId,
          contract_id: contractId,
          asaas_payment_id: paymentData.id,
          amount: value,
          due_date: due,
          status: 'pending',
          payment_method: 'boleto',
        },
        { onConflict: 'asaas_payment_id' },
      )
      .select('id, due_date, status')
      .single();

    return NextResponse.json(
      {
        success: true,
        payment: localPayment || null,
        warning: insertErr
          ? 'ATENCAO: boleto criado no Asaas (' + paymentData.id + ') mas falha ao registrar localmente: ' + insertErr.message
          : null,
        asaas_payment_id: paymentData.id,
        bankSlipUrl: paymentData.bankSlipUrl || paymentData.invoiceUrl || null,
        identificationField: paymentData.identificationField || null,
        value,
        dueDate: due,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno ao gerar boleto.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial', 'attendant']);
