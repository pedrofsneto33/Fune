import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logError } from '@/lib/http-error';
import { recordIncome } from '@/lib/financial';
import { generateCommission } from '@/lib/commissions';

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

  // SECURITY (doc oficial Asaas): a validação de origem é o TOKEN de
  // autenticação no header 'asaas-access-token' — o Asaas NÃO assina o corpo
  // do webhook (não existe HMAC nativo; o bloco HMAC anterior era código
  // morto que nunca rodaria, dando falsa sensação de segurança).
  // Defesa extra opcional: whitelist de IPs oficiais via ASAAS_ALLOWED_IPS.
  const allowedIps = (process.env.ASAAS_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (allowedIps.length > 0) {
    if (clientIP === 'unknown' || !allowedIps.includes(clientIP)) {
      logError(`IP ${clientIP} fora da whitelist`, '[asaas-webhook] origem nao autorizada');
      return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 });
    }
  }

  const webhookToken = req.headers.get('asaas-access-token');

  if (!webhookToken) {
    return NextResponse.json({ error: 'Token de webhook ausente' }, { status: 401 });
  }
  if (webhookToken.length < 16) {
    // Não bloqueia (tokens legados curtos continuam funcionando), mas grita:
    // token fraco é problema de configuração, não do request.
    logError(`token com ${webhookToken.length} chars`, '[asaas-webhook] TOKEN FRACO — rotacione');
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

  // IDEMPOTENCIA (doc Asaas: entrega at-least-once): se este par
  // (pagamento, evento) ja foi PROCESSADO com sucesso, responde 200 sem
  // reprocessar — o Asaas para de reenviar. Em caso de corrida, a transicao
  // de status no payments continua garantindo que receita/comissao nao dupliquem.
  try {
    const { data: already } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .eq('tenant_id', tenant.id)
      .eq('event', event ?? '')
      .eq('processed', true)
      .limit(1);
    if (already && already.length > 0) {
      return NextResponse.json({ received: true, processed: 'duplicated' });
    }
  } catch {
    /* dedup best-effort: a transicao de status no payments e quem garante idempotencia */
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
      .eq('tenant_id', tenant.id)
      .neq('status', 'cancelled');
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