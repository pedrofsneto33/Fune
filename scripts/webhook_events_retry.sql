-- ============================================================
-- RETRY MANUAL DE WEBHOOKS
-- Adiciona colunas para controle de retentativas manuais.
-- RODAR NO SUPABASE SQL EDITOR (idempotente).
-- ============================================================

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS last_retried_at TIMESTAMPTZ;

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS retry_error TEXT;

CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed
  ON public.webhook_events(received_at DESC)
  WHERE processed = FALSE;
