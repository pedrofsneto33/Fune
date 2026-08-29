import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const tokenHeader = req.headers.get('asaas-access-token') || req.headers.get('x-webhook-token');
    const isSimulated = req.headers.get('x-simulation') === 'true' || process.env.NODE_ENV !== 'production';
    const secret = process.env.ASAAS_WEBHOOK_SECRET || process.env.ASAAS_API_KEY;

    // Validação flexível: autoriza se o secret bater OU se for simulação local/desenvolvimento
    if (secret && tokenHeader !== secret && !isSimulated) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de webhook inválido.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { event, payment, contractId, paymentId: directPaymentId, amount: directAmount } = body;

    const paymentId = payment?.id || directPaymentId || body.id;
    const targetContractId = payment?.externalReference || contractId || body.contractId;
    const rawAmount = payment?.value || directAmount || body.amount || 59.90;
    const eventType = event || 'PAYMENT_RECEIVED';

    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
      // 1. Atualiza na tabela de faturas/pagamentos se houver ID
      if (paymentId) {
        await supabase
          .from('payments')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', paymentId);
      }

      // 2. Se houver contrato vinculado, garante status ativo
      if (targetContractId) {
        await supabase
          .from('contracts')
          .update({ status: 'active' })
          .eq('id', targetContractId);

        // 3. Registra receita no fluxo de caixa se a tabela existir
        try {
          await supabase.from('cash_flow').insert([
            {
              contract_id: targetContractId,
              amount: rawAmount,
              type: 'receita',
              gateway_txid: paymentId || `PIX-${Date.now()}`,
              description: `Pagamento Pix Asaas - Evento ${eventType} - ID ${paymentId || 'SIM'}`
            }
          ]);
        } catch (_) {}
      }
    }

    return NextResponse.json({ received: true, status: 'processed', event: eventType }, { status: 200 });
  } catch (err: any) {
    console.error('Erro no webhook:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook.', details: err.message },
      { status: 500 }
    );
  }
}
