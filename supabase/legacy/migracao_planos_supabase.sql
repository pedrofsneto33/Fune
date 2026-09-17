-- ============================================================
-- ETERNITYOS - MIGRACAO: Planos Comerciais
-- Essencial / Profissional / Enterprise (com limites de uso)
-- Seguro para rodar multiplas vezes (idempotente).
-- ============================================================

-- 1) Cria a coluna do plano comercial na tabela de tenants (empresas/filiais)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS commercial_plan VARCHAR(20) DEFAULT 'essencial';

-- 2) Garante que nenhuma filial fique sem plano definido
UPDATE public.tenants
SET commercial_plan = 'essencial'
WHERE commercial_plan IS NULL;

-- 3) Restringe os valores aceitos (so cria a constraint se ainda nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_commercial_plan_check'
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_commercial_plan_check
      CHECK (commercial_plan IN ('essencial', 'profissional', 'enterprise'));
  END IF;
END $$;

-- 4) Indices para as verificacoes de limite (contagem rapida por tenant)
CREATE INDEX IF NOT EXISTS idx_holders_tenant_id ON public.holders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles (tenant_id);

-- 5) VERIFICACAO final: deve listar as filiais com o plano 'essencial'
SELECT name, trade_name, commercial_plan FROM public.tenants;
