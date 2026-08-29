import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Eventos Asaas: PAYMENT_RECEIVED ou PAYMENT_CONFIRMED
    const event = body.event;
    const payment = body.payment;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const contractId = payment.externalReference;
      const amountPaid = payment.value;
      const paymentDate = payment.paymentDate || new Date().toISOString();

      console.log(`[CONCILIACAO AUTOMATICA] Pagamento confirmado: Contrato ${contractId}, Valor R$ ${amountPaid}, Data: ${paymentDate}`);

      // Aqui o sistema realiza a baixa automática no banco/Supabase
      // Atualizar o status da mensalidade/contrato para "pago"
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no processamento do webhook:', error);
    return NextResponse.json({ error: 'Falha no processamento' }, { status: 500 });
  }
}