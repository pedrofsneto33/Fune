import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event = body.event;
    const payment = body.payment;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const contractId = payment?.externalReference;

      if (contractId) {
        await supabase
          .from('contracts')
          .update({
            status: 'pago',
            last_payment_date: new Date().toISOString()
          })
          .eq('id', contractId);

        await supabase
          .from('financial_transactions')
          .insert([{
            contract_id: contractId,
            amount: payment.value,
            type: 'receita',
            gateway_txid: payment.id,
            description: `Pagamento Pix Asaas - Evento ${event}`,
            created_at: new Date().toISOString()
          }]);

        console.log(`[ASAAS WEBHOOK] Pagamento recebido para contrato ${contractId}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processado com sucesso.' });
  } catch (error: any) {
    console.error('Erro no processamento do webhook Asaas:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no webhook' }, { status: 500 });
  }
}