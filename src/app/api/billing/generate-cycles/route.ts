import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
        holders ( id, full_name, cpf, phone, email ),
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

    for (const contract of contracts as any[]) {
      if (billedContractIds.has(contract.id)) {
        skippedCount++;
        continue;
      }

      const holder = contract.holders;
      const plan = contract.plans;
      const amount = Number(plan?.monthly_fee || 0);

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
          const asaasRes = await fetch(`${asaasBaseUrl}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: tenant.asaas_api_key,
            },
            body: JSON.stringify({
              customer: holder.cpf.replace(/\D/g, ''),
              billingType: billingType.toUpperCase(),
              value: amount,
              dueDate: targetDueDate,
              description: `Mensalidade ${plan.name} - ${formattedMonth}`,
            }),
          });

          if (asaasRes.ok) {
            const asaasData = await asaasRes.json();
            asaasPaymentId = asaasData.id;
            pixCode = asaasData.pixTransaction?.qrCode?.payload || null;
            pixQrCodeUrl = asaasData.pixTransaction?.qrCode?.encodedImage || null;
          }
        } catch (apiErr) {
          console.warn(`Falha na chamada Asaas para contrato ${contract.id}:`, apiErr);
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
    });
  } catch (error: any) {
    console.error('Erro ao gerar cobranças em lote:', error);
    return NextResponse.json({ error: 'Erro interno ao processar lote de cobranças.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);
