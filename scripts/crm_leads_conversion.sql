-- ============================================================
-- CRM: MARCAR CONVERSIÓN (lead ganho -> tenant real)
-- Adiciona colunas para registrar ONDE e QUANDO o lead se converteu
-- em funerária real (tenant). Previne conversión duplicada y deixa
-- rastro auditable. RODAR NO SUPABASE SQL EDITOR (idempotente).
-- ============================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_leads_converted ON public.leads(converted_at);