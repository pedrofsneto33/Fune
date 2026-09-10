-- ============================================================
-- CRM: HISTÓRICO DE INTERAÇÕES POR LEAD (lead_notes)
-- Registro estruturado de ligações, WhatsApp, e-mails, reuniões,
-- respostas, etc. — em lugar de misturar tudo no campo notes.
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