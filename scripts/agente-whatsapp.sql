-- ============================================================
-- ETERNITYOS - AGENTE DE TRIAGEM WHATSAPP (Plantao 24h)
-- Provedor: Evolution API (self-hosted, gratis)
-- Seguro para rodar multiplas vezes (idempotente).
-- ============================================================

-- 1) Enriquecer a tabela de despachos de emergencia com dados do triage
ALTER TABLE public.emergency_dispatches
  ADD COLUMN IF NOT EXISTS deceased_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS family_contact TEXT,
  ADD COLUMN IF NOT EXISTS caller_phone TEXT,
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'telefone';

-- 2) Sessoes conversacionais do bot (maquina de estado por telefone)
CREATE TABLE IF NOT EXISTS public.whatsapp_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  step VARCHAR(40) NOT NULL DEFAULT 'init',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, phone)
);

-- 3) Mapeamento numero WhatsApp <-> tenant (cada funeraria tem o seu numero)
CREATE TABLE IF NOT EXISTS public.tenant_whatsapp_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
  evolution_instance VARCHAR(100) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) RLS
ALTER TABLE public.whatsapp_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- 5) Indices
CREATE INDEX IF NOT EXISTS idx_emergency_dispatches_tenant
  ON public.emergency_dispatches(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_tenant_phone
  ON public.whatsapp_agent_sessions(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_number
  ON public.tenant_whatsapp_numbers(whatsapp_number);

-- 6) Politicas de isolamento por tenant (mesmo padrao das demais tabelas)
DROP POLICY IF EXISTS "whatsapp_agent_sessions_tenant_isolation" ON public.whatsapp_agent_sessions;
CREATE POLICY "whatsapp_agent_sessions_tenant_isolation"
  ON public.whatsapp_agent_sessions
  FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());

DROP POLICY IF EXISTS "tenant_whatsapp_numbers_tenant_isolation" ON public.tenant_whatsapp_numbers;
CREATE POLICY "tenant_whatsapp_numbers_tenant_isolation"
  ON public.tenant_whatsapp_numbers
  FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());

DROP POLICY IF EXISTS "emergency_dispatches_tenant_isolation_agent" ON public.emergency_dispatches;
CREATE POLICY "emergency_dispatches_tenant_isolation_agent"
  ON public.emergency_dispatches
  FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());

-- 7) VERIFICACAO final
SELECT 'whatsapp_agent_sessions' AS tabela, COUNT(*) FROM public.whatsapp_agent_sessions
UNION ALL
SELECT 'tenant_whatsapp_numbers', COUNT(*) FROM public.tenant_whatsapp_numbers
UNION ALL
SELECT 'emergency_dispatches.colunas', COUNT(*) FROM information_schema.columns
  WHERE table_name = 'emergency_dispatches' AND column_name IN ('deceased_name','location','family_contact','caller_phone','source');