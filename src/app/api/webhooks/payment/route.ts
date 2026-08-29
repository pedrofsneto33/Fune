import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const asaasToken = req.headers.get('asaas-access-token');
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken || asaasToken !== expectedToken) {
      console.error('⛔ Acesso negado: Token do webhook Asaas ausente ou inválido.');
      return NextResponse.json(
        { error: 'Não autorizado. Token de webhook inválido.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { event, payment } = body;

    if (!payment || !event) {
      return NextResponse.json({ error: 'Payload incompleto.' }, { status: 400 });
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const contractId = payment.externalReference;
      const paymentId = payment.id;
      const amount = payment.value;

      if (contractId) {
        await supabaseAdmin
          .from('contracts')
          .update({
            status: 'ativo',
            last_payment_date: new Date().toISOString()
          })
          .eq('id', contractId);

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('contract_id', contractId)
          .eq('status', 'pending');

        const { data: existingTx } = await supabaseAdmin
          .from('financial_transactions')
          .select('id')
          .eq('gateway_txid', paymentId)
          .limit(1);

        if (!existingTx || existingTx.length === 0) {
          await supabaseAdmin
            .from('financial_transactions')
            .insert([{
              contract_id: contractId,
              amount: amount,
              type: 'receita',
              gateway_txid: paymentId,
              description: `Pagamento Pix Asaas - Evento ${event} - ID ${paymentId}`,
              created_at: new Date().toISOString()
            }]);
        }
      }
    }

    return NextResponse.json({ received: true, status: 'processed' }, { status: 200 });
  } catch (err: any) {
    console.error('💥 Erro no processamento do webhook Asaas:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook.', details: err.message },
      { status: 500 }
    );
  }
}