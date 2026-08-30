import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const webhookToken = req.headers.get('asaas-access-token');

  if (!webhookToken) {
    return NextResponse.json({ error: 'Token de webhook ausente' }, { status: 401 });
  }

  const body = await req.json();
  const { event, payment } = body;

  if (!payment?.id) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('asaas_webhook_token', webhookToken)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Token de webhook inválido' }, { status: 403 });
  }

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const { data: updatedPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        paid_at: payment.confirmedDate || new Date().toISOString(),
        payment_method: payment.billingType?.toLowerCase() || 'pix',
      })
      .eq('asaas_payment_id', payment.id)
      .eq('tenant_id', tenant.id)
      .select('id, amount, contract_id')
      .single();

    if (paymentError || !updatedPayment) {
      return NextResponse.json({ error: 'Pagamento não localizado para este tenant' }, { status: 404 });
    }

    await supabaseAdmin.from('financial_transactions').insert({
      tenant_id: tenant.id,
      payment_id: updatedPayment.id,
      type: 'income',
      category: 'plan_subscription',
      amount: updatedPayment.amount,
      description: `Recebimento Asaas - Pagamento ID ${payment.id}`,
      transaction_date: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', updatedPayment.contract_id)
      .eq('tenant_id', tenant.id);
  }

  return NextResponse.json({ received: true });
}
