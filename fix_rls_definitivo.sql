-- ============================================================
-- FIX DEFINITIVO - ISOLAMENTO RLS (rodar em query NOVO vazio)
-- Remove qualquer policy residual e cria APENAS a correta.
-- ============================================================

-- (0) GARANTE AS FUNCOES
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'superadmin'
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- (1) HABILITA RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapel_burials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thanatopraxy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convalescence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convalescence_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_carnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_reserves ENABLE ROW LEVEL SECURITY;

-- (2) REMOVE TODAS AS POLICIES de tenants/holders/plans (nomes conhecidos e variantes)
DROP POLICY IF EXISTS "tenants_self_or_super" ON public.tenants;
DROP POLICY IF EXISTS "tenants_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete" ON public.tenants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tenants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tenants;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.tenants;

DROP POLICY IF EXISTS "holders_tenant_isolation" ON public.holders;
DROP POLICY IF EXISTS "holders_all" ON public.holders;
DROP POLICY IF EXISTS "holders_select" ON public.holders;
DROP POLICY IF EXISTS "holders_insert" ON public.holders;
DROP POLICY IF EXISTS "holders_update" ON public.holders;
DROP POLICY IF EXISTS "holders_delete" ON public.holders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.holders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.holders;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.holders;

DROP POLICY IF EXISTS "plans_tenant_isolation" ON public.plans;
DROP POLICY IF EXISTS "plans_all" ON public.plans;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.plans;

-- (3) CRIA APENAS AS POLICIES CORRETAS
CREATE POLICY "tenants_self_or_super" ON public.tenants
FOR ALL
TO authenticated
USING (id = public.get_user_tenant_id() OR public.is_superadmin())
WITH CHECK (id = public.get_user_tenant_id() OR public.is_superadmin());

CREATE POLICY "holders_tenant_isolation" ON public.holders
FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());

CREATE POLICY "plans_tenant_isolation" ON public.plans
FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());

DROP POLICY IF EXISTS "user_roles_self_or_super" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_all" ON public.user_roles;

CREATE POLICY "user_roles_self_or_super" ON public.user_roles
FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id())
    OR public.is_superadmin()
);

-- (4) PRINT DE CONFERENCIA (deve listar apenas as policies acima)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('tenants','holders','plans','user_roles')
ORDER BY tablename, policyname;