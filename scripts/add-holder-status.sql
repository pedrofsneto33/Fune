-- ============================================================
-- Situacao do titular (inativar sem excluir historico)
-- RODE NO SUPABASE: Dashboard > SQL Editor > cole e execute.
-- ============================================================
ALTER TABLE public.holders
  ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'ativo';

CREATE INDEX IF NOT EXISTS idx_holders_tenant_status
  ON public.holders(tenant_id, status);
