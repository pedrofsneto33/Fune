import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { isHolderActive } from '@/lib/eligibility';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString } from '@/lib/validation';

/**
 * @deprecated Rota órfã — auditoria 2026-09.
 * 0 chamadores na UI, em scripts, em middleware ou em cron in-repo.
 * Chamável apenas via HTTP externo/manual.
 * Manter até confirmação do produto sobre uso externo (ver docs/GRAPHIFY.md).
 * Não remover nem refatorar sem ticket.
 */
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { dueDay = 10, targetMonth, billingType = 'PIX' } = body;

    // 1. Definir mês de referência (YYYY-MM)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const formattedMonth = targetMonth || `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
    const targetDueDate = `${formattedMonth}-${String(dueDay).padStart(2, '0')}`;

    // 2. Buscar dados do Tenant e chaves do Asaas
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, asaas_api_key')
      .eq('id', auth.tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    // 3. Buscar todos os contratos ativos do Tenant
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select(`
        id,
        holder_id,
        plan_id,
        status,
        holders ( id, full_name, cpf, phone, email, status ),
        plans ( id, name, monthly_fee )
      `)
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'active');

    if (contractsError) {
      return NextResponse.json({ error: contractsError.message }, { status: 500 });
    }

    if (!contracts || contracts.length === 0) {
      return NextResponse.json({
        message: 'Nenhum contrato ativo encontrado para este tenant.',
        generatedCount: 0,
        skippedCount: 0,
      });
    }

    // 4. Buscar pagamentos já existentes para essa data de vencimento (evitar duplicidade)
    const { data: existingPayments } = await supabaseAdmin
      .from('payments')
      .select('contract_id')
      .eq('tenant_id', auth.tenantId)
      .eq('due_date', targetDueDate);

    const billedContractIds = new Set((existingPayments || []).map((p) => p.contract_id));

    const paymentsToInsert: any[] = [];
    let skippedCount = 0;
    const errors: Array<{ contract_id: string; error: string }> = [];

    for (const contract of contracts as any[]) {
      if (billedContractIds.has(contract.id)) {
        skippedCount++;
        continue;
      }

      const holder = contract.holders;
      const plan = contract.plans;
      const amount = Number(plan?.monthly_fee || 0);

      // REGRA ÚNICA: titular inativo (bilingue) nunca é cobrado, mesmo com contrato ativo
      const hStatus = String(holder?.status ?? '').toLowerCase();
      if (!isHolderActive(hStatus)) {
        skippedCount++;
        continue;
      }

      if (amount <= 0 || !holder) {
        skippedCount++;
        continue;
      }

      let asaasPaymentId = null;
      let pixCode = null;
      let pixQrCodeUrl = null;

      // Integração direta com Asaas se a chave estiver configurada
      if (tenant.asaas_api_key) {
        try {
          const asaasBaseUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
          const headers = {
            'Content-Type': 'application/json',
            access_token: tenant.asaas_api_key,
          };

          // a/b) Normaliza CPF e guarda de 11 dígitos — não gravar payment se inválido
          const cleanCpf = (holder.cpf ?? '').replace(/\D/g, '');
          if (cleanCpf.length !== 11) {
            errors.push({ contract_id: contract.id, error: 'CPF inválido ou ausente' });
            continue;
          }

          // c/d) Localiza ou cadastra o customer no Asaas (padrão billing/avulso)
          const searchRes = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${cleanCpf}`, {
            headers: { access_token: tenant.asaas_api_key },
          });
          const searchData = await searchRes.json().catch(() => ({}));
          let customerId: string | undefined = searchData?.data?.[0]?.id;
          if (!customerId) {
            // Asaas exige formato internacional para mobilePhone (ex: +5586999990000)
            // — mesmo normalização do billing/avulso.
            let mobilePhone: string | undefined;
            if (holder.phone) {
              const digits = String(holder.phone).replace(/\D/g, '');
              if (digits.length >= 10) {
                const intl = digits.length >= 13 ? digits : digits.startsWith('55') ? digits : `55${digits}`;
                mobilePhone = `+${intl}`;
              }
            }
            const createCustRes = await fetch(`${asaasBaseUrl}/customers`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                name: sanitizeString(holder.full_name || '', 120),
                cpfCnpj: cleanCpf,
                email: holder.email ?? undefined,
                mobilePhone,
              }),
            });
            const createCustData = await createCustRes.json().catch(() => ({}));
            if (createCustData.errors || !createCustData.id) {
              errors.push({
                contract_id: contract.id,
                error:
                  'Falha ao cadastrar customer no Asaas: ' +
                  (createCustData.errors?.[0]?.description || 'erro desconhecido'),
              });
              continue;
            }
            customerId = createCustData.id;
          }

          const asaasRes = await fetch(`${asaasBaseUrl}/payments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              customer: customerId,
              billingType: billingType.toUpperCase(),
              value: amount,
              dueDate: targetDueDate,
              description: `Mensalidade ${plan.name} - ${formattedMonth}`,
            }),
          });

          // Sem falha silenciosa: sempre ler o corpo e checar ok/errors
          const asaasData = await asaasRes.json().catch(() => ({}));
          if (!asaasRes.ok || !asaasData.id) {
            console.warn(
              `Asaas recusou cobrança para contrato ${contract.id}:`,
              asaasData.errors || asaasData,
            );
            errors.push({
              contract_id: contract.id,
              error: 'Asaas recusou a cobrança: ' + (asaasData.errors?.[0]?.description || 'erro desconhecido'),
            });
            continue; // não inserir linha em payments
          }
          asaasPaymentId = asaasData.id;
          pixCode = asaasData.pixTransaction?.qrCode?.payload || null;
          pixQrCodeUrl = asaasData.pixTransaction?.qrCode?.encodedImage || null;
        } catch (apiErr) {
          console.warn(`Falha na chamada Asaas para contrato ${contract.id}:`, apiErr);
          errors.push({ contract_id: contract.id, error: 'asaas_request_failed' });
          continue; // não inserir linha em payments em falha de request
        }
      }

      paymentsToInsert.push({
        tenant_id: auth.tenantId,
        contract_id: contract.id,
        asaas_payment_id: asaasPaymentId,
        amount,
        due_date: targetDueDate,
        status: 'pending',
        payment_method: billingType.toLowerCase(),
        pix_code: pixCode,
        pix_qr_code_url: pixQrCodeUrl,
      });
    }

    if (paymentsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentsToInsert);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ciclo de cobrança gerado para ${formattedMonth}.`,
      dueDate: targetDueDate,
      totalActiveContracts: contracts.length,
      generatedCount: paymentsToInsert.length,
      skippedCount,
      errors,
    });
  } catch (error: any) {
    console.error('Erro ao gerar cobranças em lote:', error);
    return NextResponse.json({ error: 'Erro interno ao processar lote de cobranças.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);
