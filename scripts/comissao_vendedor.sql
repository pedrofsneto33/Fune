-- ============================================================
-- ETERNITYOS - COMISSAO POR VENDEDOR (PASSO 1: schema)
-- Rodar no Supabase SQL Editor.
-- ============================================================

-- 1) Planos: percentuais de comissao (por plano, nao fixo global)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS commission_rate_initial NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate_recurring NUMERIC(5,2) NOT NULL DEFAULT 0;

-- 2) Contratos: vendedor responsavel (texto livre por enquanto)
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS seller_name VARCHAR(150);

-- 3) Comissoes: indice para busca por contrato (estorno por carência)
CREATE INDEX IF NOT EXISTS idx_commissions_contract_id ON public.commissions (contract_id);
