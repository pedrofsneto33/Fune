-- ============================================================
-- ETERNITYOS - VENDEDORES/AGENTES (PASSO 1: schema)
-- Rodar no Supabase SQL Editor. Idempotente.
-- ============================================================

-- 1) Tabla de vendedores (agentes de vendas de cada funeraria)
CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 2) Indice por tenant (aislamento + busqueda rapida)
CREATE INDEX IF NOT EXISTS idx_sellers_tenant ON public.sellers (tenant_id);

-- 3) RLS: isolamento por tenant
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sellers_tenant_isolation" ON public.sellers;
CREATE POLICY "sellers_tenant_isolation" ON public.sellers
  FOR ALL
  USING ((tenant_id = get_user_tenant_id()) OR is_superadmin())
  WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_superadmin());

-- 4) Columna seller_id en contracts (FK nullable) para vincular la venta al vendedor
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL;