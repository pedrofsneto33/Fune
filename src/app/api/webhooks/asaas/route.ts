import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logError } from '@/lib/http-error';
import { recordIncome } from '@/lib/financial';
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

  // AUDITORIA: registra o evento bruto. Degradacao graciosa — se a tabela
  // webhook_events ainda nao existir (migration pendente), o webhook segue
  // funcionando normalmente.
  let webhookEventId: string | null = null;
  try {
    const { data: evt } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        tenant_id: tenant.id,
        provider: 'asaas',
        event: event ?? null,
        asaas_payment_id: payment.id,
        payload: body,
      })
      .select('id')
      .single();
    webhookEventId = evt?.id ?? null;
  } catch {
    /* auditoria e best-effort */
  }

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    // IDEMPOTENCIA: o Asaas envia PAYMENT_CONFIRMED *e* PAYMENT_RECEIVED para o
    // mesmo pagamento (e pode reenviar eventos). Processa apenas a TRANSICAO
    // para 'paid' — se ja estava pago, o update nao afeta nenhuma linha e os
    // side effects (receita + comissao) sao pulados. Sem isso, o Livro Caixa e
    // as comissoes saem duplicados.
    const rawMethod = String(payment.billingType || '').toLowerCase();
    const allowedMethods = new Set(['pix', 'boleto', 'credit_card', 'cash']);
    const { data: updatedPayments, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        paid_at: payment.confirmedDate || new Date().toISOString(),
        payment_method: allowedMethods.has(rawMethod) ? rawMethod : null,
      })
      .eq('asaas_payment_id', payment.id)
      .eq('tenant_id', tenant.id)
      .neq('status', 'paid') // so transicao: de nao-pago para pago
      .select('id, amount, contract_id');

    if (paymentError) {
      logError(paymentError, '[asaas-webhook] erro ao marcar pagamento como pago');
      await markWebhookEvent(webhookEventId, false, 'erro ao marcar pagamento pago: ' + paymentError.message);
      return NextResponse.json({ error: 'Erro interno ao processar pagamento' }, { status: 500 });
    }

    if (!updatedPayments || updatedPayments.length === 0) {
      // Nao e falha: evento duplicado (ja pago) OU cobranca avulsa/carne que nao
      // vive na tabela payments. Confirma recebimento (200) pro Asaas parar de
      // reenviar — 404 aqui fazia o Asaas retentar indefinidamente.
      await markWebhookEvent(webhookEventId, true, 'sem transicao: evento duplicado (ja pago) ou pagamento nao rastreado (avulso/carne)');
      return NextResponse.json({ received: true, processed: false });
    }

    const updatedPayment = updatedPayments[0];

    const income = await recordIncome({
      tenantId: tenant.id,
      amount: Number(updatedPayment.amount),
      category: 'plan_subscription',
      description: `Recebimento Asaas - Pagamento ID ${payment.id}`,
      paymentId: updatedPayment.id,
      source: 'asaas_webhook',
    });
    if (!income.ok) {
      // Nao falhar o webhook (pagamento ja esta pago; reenvio cairia na
      // idempotencia). Registrar para monitoria — receita faltante e grave.
      logError(income.error, '[asaas-webhook] FALHA AO REGISTRAR RECEITA no Livro Caixa');
    }

    const { error: contractUpdateError } = await supabaseAdmin
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', updatedPayment.contract_id)
      .eq('tenant_id', tenant.id);
    if (contractUpdateError) {
      logError(contractUpdateError, '[asaas-webhook] erro ao reativar contrato');
    }

    // PASSO 6: gerar comissão por vendedor no pagamento confirmado
    await generateCommission(supabaseAdmin, tenant.id, updatedPayment);

    await markWebhookEvent(webhookEventId, true);
  }

  await markWebhookEvent(webhookEventId, true, 'evento nao tratado');
  return NextResponse.json({ received: true });
}

// Marca o resultado do processamento do evento auditado (best-effort:
// auditoria nunca pode quebrar o fluxo de cobranca).
async function markWebhookEvent(
  id: string | null,
  processed: boolean,
  skippedReason?: string,
) {
  if (!id) return;
  try {
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed,
        skipped_reason: skippedReason ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
  } catch {
    /* best-effort */
  }
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