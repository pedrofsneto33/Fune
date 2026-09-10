-- ============================================================
-- CRM: HISTÓRICO DE INTERACCIONES POR LEAD (lead_notes)
-- Registro estructurado de llamadas, WhatsApp, e-mails, citas,
-- respuestas, etc. — en lugar de mezclarlo todo en el campo notes.
-- RODAR NO SUPABASE SQL EDITOR (idempotente).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON public.lead_notes(lead_id, created_at DESC);