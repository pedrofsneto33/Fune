import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { isValidUUID } from '@/lib/validation';
import { logError } from '@/lib/http-error';
import { generateCommission } from '@/lib/commissions';

// ============================================================
// RETRY MANUAL DE WEBHOOK
// POST /api/webhooks/retry  { eventId: string }
// Reexecuta o processamento de um evento que falhou ou foi ignorado.
// ============================================================

const RETRY_RATE_LIMIT = { maxAttempts: 10, windowMs: 60000 };
const MAX_RETRIES = 5;

export const POST = withAuth(async (req: NextRequest, { auth }) => {const rl = await checkRateLimit(`webhook-retry:${auth.userId}`, RETRY_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitos retries em sequência. Aguarde um minuto.' },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { eventId } = body;

  if (!eventId || !isValidUUID(eventId)) {
    return NextResponse.json({ error: 'ID do evento inválido.' }, { status: 400 });
  }

  const { data: event, error: fetchError } = await supabaseAdmin
    .from('webhook_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !event) {
    return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });
  }

  if (auth.role !== 'superadmin' && event.tenant_id !== auth.tenantId) {
    return NextResponse.json({ error: 'Sem acesso a este evento.' }, { status: 403 });
  }

  if ((event.retry_count || 0) >= MAX_RETRIES) {
    return NextResponse.json(
      { error: `Limite de ${MAX_RETRIES} retries atingido.` },
      { status: 429 },
    );
  }

  // Metadados de retry sao best-effort: se a migration webhook_events_retry.sql
  // ainda nao foi aplicada (colunas ausentes no banco), o reprocessamento do
  // pagamento continua — auditoria nao pode bloquear dinheiro.
  const { error: metaError } = await supabaseAdmin
    .from('webhook_events')
    .update({
      retry_count: (event.retry_count || 0) + 1,
      last_retried_at: new Date().toISOString(),
      retry_error: null,
    })
    .eq('id', eventId);

  if (metaError) {
    logError(metaError, '[webhook-retry] metadados de retry nao gravados (migration pendente?)');
  }

  try {
    const result = await reprocessEvent(event as any);
    // Auditoria best-effort: nunca falhar por coluna ausente (migration pendente).
    const { error: auditError } = await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: result.success,
        processed_at: result.success ? new Date().toISOString() : null,
        retry_error: result.success ? null : result.error,
      })
      .eq('id', eventId);
    if (auditError) {
      logError(auditError, '[webhook-retry] resultado nao auditado (migration pendente?)');
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Evento reprocessado com sucesso.' });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  } catch (err: any) {
    try {
      await supabaseAdmin
        .from('webhook_events')
        .update({ retry_error: err.message || 'Erro desconhecido' })
        .eq('id', eventId);
    } catch {
      /* best-effort */
    }
    return NextResponse.json({ error: 'Erro ao reprocessar evento.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);

async function reprocessEvent(event: {
  id: string;
  tenant_id: string;
  payload: any;
  event: string;
  asaas_payment_id: string;
}): Promise<{ success: boolean; error?: string }> {
  const { tenant_id, payload } = event;
  if (!payload || typeof payload !== 'object') {
    return { success: false, error: 'Payload inválido.' };
  }

  const paymentId = payload.payment?.id || event.asaas_payment_id;
  if (!paymentId) {
    return { success: false, error: 'Pagamento não identificado.' };
  }

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('asaas_payment_id', paymentId)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (!payment) {
    return { success: false, error: 'Pagamento não localizado no sistema.' };
  }

  if (payment.status === 'paid') {
    return { success: true };
  }

  const eventType = payload.event || event.event;
  if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
    // Transição idempotente (mesma semântica do webhook): só marca se ainda
    // nao estava pago. Corrida com o webhook real nao duplica receita — o
    // UPDATE re-checa o predicado apos o lock da linha (READ COMMITTED).
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)
      .eq('tenant_id', tenant_id)
      .neq('status', 'paid')
      .select('id, amount, contract_id');

    if (updateError) {
      return { success: false, error: 'Erro ao atualizar pagamento.' };
    }
    if (!updated || updated.length === 0) {
      // Ja estava pago (corrida com webhook real): idempotente, sucesso.
      return { success: true };
    }
    const updatedPayment = updated[0];

    const { recordIncome } = await import('@/lib/financial');
    const incomeResult = await recordIncome({
      tenantId: tenant_id,
      amount: Number(updatedPayment.amount),
      category: 'plan_subscription',
      description: `Reprocessamento manual de webhook — Pagamento ${paymentId}`,
      paymentId: updatedPayment.id,
      source: 'asaas_webhook',
    });

    if (!incomeResult.ok) {
      return { success: false, error: 'Falha ao registrar receita: ' + (incomeResult.error || '') };
    }

    // Reativa contrato e gera comissão — mesma semântica do webhook principal.
    if (updatedPayment.contract_id) {
      await supabaseAdmin
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', updatedPayment.contract_id)
        .eq('tenant_id', tenant_id)
        .neq('status', 'cancelled');
    }
    await generateCommission(supabaseAdmin, tenant_id, updatedPayment as any);

    return { success: true };
  }

  return { success: false, error: `Evento "${eventType}" não requer reprocessamento.` };
}
