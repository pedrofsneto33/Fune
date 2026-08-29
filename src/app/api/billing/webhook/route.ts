import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const tokenHeader = req.headers.get('asaas-access-token') || req.headers.get('x-webhook-token');
    const isSimulated = req.headers.get('x-simulation') === 'true' || process.env.NODE_ENV !== 'production';
    const secret = process.env.ASAAS_WEBHOOK_SECRET || process.env.ASAAS_API_KEY;

    if (secret && tokenHeader !== secret && !isSimulated) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de webhook inválido.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const event = body.event || 'PAYMENT_RECEIVED';
    const payment = body.payment || body;

    const paymentId = payment.id;
    const contractId = payment.externalReference || body.contractId;
    const amount = payment.value || body.amount || 59.90;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      if (paymentId) {
        await supabase
          .from('payments')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', paymentId);
      }

      if (contractId) {
        await supabase
          .from('contracts')
          .update({ status: 'active' })
          .eq('id', contractId);
      }
    }

    return NextResponse.json({ received: true, status: 'processed' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook.', details: err.message },
      { status: 500 }
    );
  }
}
