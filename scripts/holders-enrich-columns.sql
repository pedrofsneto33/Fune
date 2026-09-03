-- ============================================================
-- ETERNITYOS - Colunas enriquidas para titulares (holders)
-- Campos: cidade, uf, data nascimento, genero, observacoes
-- Idempotentes (ADD COLUMN IF NOT EXISTS) - pode rodar multiplas vezes
-- Executar no Supabase SQL Editor
-- ============================================================
ALTER TABLE public.holders
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS state          VARCHAR(2),
  ADD COLUMN IF NOT EXISTS birth_date     DATE,
  ADD COLUMN IF NOT EXISTS gender         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS observations   TEXT;

-- Indices leves para filtros futuros
CREATE INDEX IF NOT EXISTS idx_holders_tenant_state
  ON public.holders (tenant_id, state);
CREATE INDEX IF NOT EXISTS idx_holders_tenant_birth
  ON public.holders (tenant_id, birth_date);
