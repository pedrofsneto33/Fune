import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const asaasHeaderToken = req.headers.get('asaas-access-token') || req.headers.get('authorization');
    const globalToken = process.env.ASAAS_WEBHOOK_TOKEN;

    const body = await req.json();
    const { event, payment } = body;

    if (!payment || !event) {
      return NextResponse.json({ error: 'Payload incompleto recebido do gateway.' }, { status: 400 });
    }

    const contractId = payment.externalReference;
    const paymentId = payment.id;
    const amount = Number(payment.value || 0);

    let tenantId: string | null = null;
    let expectedTenantToken: string | null = null;

    // Localizar o contrato para identificar a empresa dona do recebível
    if (contractId) {
      const { data: contractData } = await supabaseAdmin
        .from('contracts')
        .select('id, tenant_id')
        .eq('id', contractId)
        .single();

      if (contractData) {
        tenantId = contractData.tenant_id;

        if (tenantId) {
          const { data: tenantData } = await supabaseAdmin
            .from('tenants')
            .select('asaas_webhook_token, asaas_api_key')
            .eq('id', tenantId)
            .single();

          if (tenantData) {
            expectedTenantToken = tenantData.asaas_webhook_token || tenantData.asaas_api_key;
          }
        }
      }
    }

    // Validação de Segurança: Token Global OU Token específico do Tenant
    const isAuthorized =
      (globalToken && asaasHeaderToken === globalToken) ||
      (expectedTenantToken && asaasHeaderToken === expectedTenantToken);

    if (!isAuthorized) {
      console.warn(`⚠️ Tentativa de webhook rejeitada. Token recebido: ${asaasHeaderToken ? 'Presente' : 'Ausente'}, Tenant: ${tenantId || 'Desconhecido'}`);
      return NextResponse.json(
        { error: 'Não autorizado. Token de webhook Asaas inválido para o tenant.' },
        { status: 401 }
      );
    }

    // Processamento de Liquidação Financeira
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_UPDATED') {
      if (contractId) {
        // 1. Atualizar Contrato
        await supabaseAdmin
          .from('contracts')
          .update({
            status: 'ativo',
            last_payment_date: new Date().toISOString()
          })
          .eq('id', contractId);

        // 2. Baixar fatura no sistema
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('contract_id', contractId)
          .eq('status', 'pending');

        // 3. Idempotência: Checar se a transação já foi contabilizada
        const { data: existingTx } = await supabaseAdmin
          .from('financial_transactions')
          .select('id')
          .eq('gateway_txid', paymentId)
          .limit(1);

        if (!existingTx || existingTx.length === 0) {
          // Inserir receita vinculada ao tenant correto
          await supabaseAdmin
            .from('financial_transactions')
            .insert([{
              tenant_id: tenantId,
              contract_id: contractId,
              amount: amount,
              type: 'receita',
              gateway_txid: paymentId,
              description: `Mensalidade Pix Asaas - Evento ${event} - ID ${paymentId}`,
              created_at: new Date().toISOString()
            }]);

          // Provisionamento automático da Reserva Regulatória (10%)
          if (tenantId && amount > 0) {
            const reserveAmount = Number((amount * 0.10).toFixed(2));
            await supabaseAdmin
              .from('regulatory_reserves')
              .insert([{
                tenant_id: tenantId,
                period: new Date().toISOString().substring(0, 7),
                reserve_type: 'funeral_plan_guarantee',
                required_amount: reserveAmount,
                current_balance: reserveAmount,
                status: 'adequada',
                notes: `Retenção automática 10% sobre pagamento Asaas ${paymentId}`
              }]);
          }
        }
      }
    }

    return NextResponse.json(
      {
        received: true,
        event,
        tenant_id: tenantId,
        status: 'processed'
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('💥 Erro no processamento do webhook Asaas Multi-tenant:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook.', details: err.message },
      { status: 500 }
    );
  }
}