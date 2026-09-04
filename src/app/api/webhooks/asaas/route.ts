import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

/**
 * Verify webhook signature using HMAC
 * Documentation: https://docs.asaas.com/docs/webhook-signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookToken = req.headers.get('asaas-access-token');
  const webhookSignature = req.headers.get('x-asaas-signature');

  if (!webhookToken) {
    return NextResponse.json({ error: 'Token de webhook ausente' }, { status: 401 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const { event, payment } = body;

  if (!payment?.id) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  // Find tenant by webhook token
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, asaas_webhook_token')
    .eq('asaas_webhook_token', webhookToken)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Token de webhook inválido' }, { status: 403 });
  }

  // SECURITY: fail-closed - se o segredo HMAC estiver configurado, a assinatura
  // e OBRIGATORIA. Ausência de assinatura também rejeita (401), não apenas
  // assinatura invalida. Para ativar: configure ASAAS_WEBHOOK_SECRET no painel
  // do Asaas e na Vercel.
  const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
  if (webhookSecret) {
    if (!webhookSignature) {
      return NextResponse.json({ error: 'Assinatura do webhook ausente' }, { status: 401 });
    }
    if (!verifyWebhookSignature(rawBody, webhookSignature, webhookSecret)) {
      return NextResponse.json({ error: 'Assinatura do webhook inválida' }, { status: 403 });
    }
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
