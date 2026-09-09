-- ============================================================
-- AUDITORIA FORENSE DE WEBHOOKS (Asaas)
-- Registra TODO evento recebido (mesmo os ignorados/duplicados),
-- permitindo conciliacao e debug de cobranca depois.
-- RODAR NO SUPABASE SQL EDITOR (idempotente).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'asaas',
    event VARCHAR(60),
    asaas_payment_id VARCHAR(100),
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    skipped_reason TEXT,
    payload JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Seguranca: nenhuma policy para clients (anon/authenticated) — apenas o
-- service role (usado pelo webhook na Vercel) acessa, pois RLS bloqueia.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_webhook_events_payment
    ON public.webhook_events(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_time
    ON public.webhook_events(tenant_id, received_at DESC);
