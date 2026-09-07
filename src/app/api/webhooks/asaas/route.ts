import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
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
  // SECURITY: rate limit por IP — webhooks nao passam pelo withAuth
  const clientIP =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const rl = checkRateLimit(`webhook:asaas:${clientIP}`, { maxAttempts: 60, windowMs: 60000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em instantes.' },
      { status: 429 },
    );
  }

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

    // PASSO 6: gerar comissão por vendedor no pagamento confirmado
    await generateCommission(supabaseAdmin, tenant.id, updatedPayment);
  }

  return NextResponse.json({ received: true });
}

// Gera comissão por vendedor quando um pagamento é confirmado.
// Regra: 1º pagamento pago do contrato → commission_rate_initial;
//        demais pagamentos → commission_rate_recurring.
// Sem vendedor ou percentual 0 → não gera nada (silenciosamente).
async function generateCommission(
  db: typeof supabaseAdmin,
  tenantId: string,
  payment: { id: string; amount: number; contract_id: string },
) {
  try {
    // 1) Buscar contrato com plano e vendedor
    const { data: contract } = await db
      .from("contracts")
      .select("id, seller_name, plan_id, start_date, plans(commission_rate_initial, commission_rate_recurring)")
      .eq("id", payment.contract_id)
      .eq("tenant_id", tenantId)
      .single();

    if (!contract) return;
    const sellerName: string | null = (contract as any)?.seller_name || null;
    const plan = (contract as any)?.plans || null;
    if (!sellerName || !plan) return; // sem vendedor ou sem plano vinculado

    const rateInitial: number = Number(plan.commission_rate_initial) || 0;
    const rateRecurring: number = Number(plan.commission_rate_recurring) || 0;
    if (rateInitial <= 0 && rateRecurring <= 0) return; // plano sem comissão

    // 2) Contar quantos pagamentos pagos esse contrato já tem
    const { count: paidCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", payment.contract_id)
      .eq("tenant_id", tenantId)
      .eq("status", "paid");

    const isFirst = (paidCount || 0) <= 1; // este acabou de ser confirmado
    const rate = isFirst ? rateInitial : rateRecurring;
    if (rate <= 0) return; // recorrente pode ser 0 (só paga na 1ª)

    const commissionAmount = Number(((payment.amount * rate) / 100).toFixed(2));
    if (commissionAmount <= 0) return;

    // 3) Inserir comissão
    await db.from("commissions").insert({
      tenant_id: tenantId,
      contract_id: payment.contract_id,
      seller_name: sellerName,
      amount: commissionAmount,
      status: "pendente",
    });
  } catch {
    // nunca falhar o webhook por causa de comissão
  }
}