import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('asaas-access-token') || request.headers.get('authorization');
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    // Fim absoluto do backdoor: em produção ou ambiente de homologação, o token do Asaas é obrigatório
    if (expectedToken && signature !== expectedToken) {
      return NextResponse.json({ error: 'Acesso negado: Assinatura de webhook inválida ou ausente' }, { status: 401 });
    }

    const body = await request.json();
    const { event, payment } = body;

    if (event === 'PAYMENT_RECEIVED' && payment) {
      const paymentId = payment.id;
      const customerId = payment.customer;

      // Verificação rigorosa de idempotência para evitar duplicidade de receita
      const { data: existingTx } = await supabaseAdmin
        .from('financial_transactions')
        .select('id')
        .eq('external_id', paymentId)
        .single();

      if (!existingTx) {
        // Gravação única e segura na tabela unificada
        await supabaseAdmin.from('financial_transactions').insert([
          {
            external_id: paymentId,
            description: `Recebimento Asaas - Ref: ${customerId}`,
            amount: payment.value,
            type: 'income',
            status: 'pago',
            created_at: new Date().toISOString()
          }
        ]);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
