import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logError } from '@/lib/http-error';

const HANDLED_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'SUBSCRIPTION_DELETED']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Webhook DEDICADO ao billing SaaS (PRIMEX cobra o tenant).
// NAO reusa /api/webhooks/asaas (dominio funerario): aqui a
// autenticacao e um token fixo em env (nao existe token por tenant).
export async function POST(req: NextRequest) {
  // Resposta 200 SEMPRE em erro interno: o Asaas nao deve retentar
  // indefinidamente; auditoria em saas_webhook_events cobre reconciliacao.
  try {
    const clientIP =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rl = await checkRateLimit(`webhook:asaas-saas:${clientIP}`, { maxAttempts: 60, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 });
    }

    const expected = process.env.SAAS_WEBHOOK_TOKEN || '';
    const received = req.headers.get('asaas-access-token') || '';
    if (!expected || received.length < 16) {
      logError(`token com ${received.length} chars`, '[asaas-saas-webhook] TOKEN AUSENTE/FRACO');
      return NextResponse.json({ error: 'Token de webhook inválido' }, { status: 401 });
    }
    const tokenHash = createHash('sha256').update(received).digest('hex');
    const expectedHash = createHash('sha256').update(expected).digest('hex');
    if (tokenHash !== expectedHash) {
      return NextResponse.json({ error: 'Token de webhook inválido' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const event = String(body?.event || '');
    const payment = body?.payment;
    const subscription = body?.subscription;
    if (!HANDLED_EVENTS.has(event)) {
      return NextResponse.json({ received: true, processed: false });
    }

    // Tenant vem pelo externalReference 'SAAS:<tenantId>' (customer ou subscription)
    const extRef = String(payment?.externalReference || subscription?.externalReference || '');
    if (!extRef.startsWith('SAAS:')) {
      return NextResponse.json({ error: 'externalReference sem prefixo SAAS' }, { status: 400 });
    }
    const tenantId = extRef.slice(5);
    if (!UUID_RE.test(tenantId)) {
      return NextResponse.json({ error: 'externalReference inválido' }, { status: 400 });
    }

    // Auditoria + dedup (at-least-once do Asaas)
    const { data: already } = await supabaseAdmin
      .from('saas_webhook_events')
      .select('id, processed')
      .eq('asaas_payment_id', payment?.id || subscription?.id || '')
      .eq('event', event)
      .eq('processed', true)
      .limit(1);
    if (already && already.length > 0) {
      return NextResponse.json({ received: true, processed: false });
    }
    const { data: evtRow, error: evtError } = await supabaseAdmin
      .from('saas_webhook_events')
      .insert({
        tenant_id: tenantId,
        event,
        asaas_payment_id: payment?.id || subscription?.id || null,
        payload: body,
        processed: false,
      })
      .select('id')
      .single();

    if (event === 'SUBSCRIPTION_DELETED') {
      const { error: cancelError } = await supabaseAdmin
        .from('saas_subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .neq('status', 'canceled');
      if (cancelError) {
        logError(cancelError, '[asaas-saas-webhook] erro ao cancelar assinatura local');
        await markWebhookEvent(evtRow?.id, false, 'erro ao cancelar: ' + cancelError.message);
        return NextResponse.json({ received: true, processed: false });
      }
      await markWebhookEvent(evtRow?.id, true);
      return NextResponse.json({ received: true });
    }

    // PAYMENT_RECEIVED / PAYMENT_CONFIRMED: renova 30 dias
    const nextDue = new Date(Date.now() + 30 * 86400000);
    const graceUntil = new Date(nextDue.getTime() + 7 * 86400000);
    const { error: renewError } = await supabaseAdmin
      .from('saas_subscriptions')
      .update({
        status: 'active',
        next_due_date: nextDue.toISOString().slice(0, 10),
        grace_until: graceUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .neq('status', 'canceled');
    if (renewError) {
      logError(renewError, '[asaas-saas-webhook] erro ao renovar assinatura local');
      await markWebhookEvent(evtRow?.id, false, 'erro ao renovar: ' + renewError.message);
      return NextResponse.json({ received: true, processed: false });
    }
    await markWebhookEvent(evtRow?.id, true);
    return NextResponse.json({ received: true });
  } catch (err) {
    logError(err, '[asaas-saas-webhook] erro inesperado');
    return NextResponse.json({ received: true, processed: false });
  }
}

// Marca o resultado da auditoria (best-effort: nunca quebra o fluxo).
async function markWebhookEvent(id: string | null | undefined, processed: boolean, skippedReason?: string) {
  if (!id) return;
  try {
    await supabaseAdmin
      .from('saas_webhook_events')
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