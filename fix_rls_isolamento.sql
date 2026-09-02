-- ============================================================================
-- FIX CRITICO: HARDENING DE RLS / ISOLAMENTO MULTI-TENANT
-- ----------------------------------------------------------------------------
-- TESTES DE QA MOSTRARAM VAZAMENTO REAL:
--   * Um usuario (cliente) conseguia VER e ALTERAR dados de OUTROS tenants
--   * A RLS nao estava ativa nas tabelas product (holders, tenants, etc.)
--
-- Este script (100% idempotente - pode rodar quantas vezes quiser):
--   1. Garante as funcoes get_user_tenant_id() e is_superadmin()
--   2. Habilita RLS em todas as tabelas tenant-scoped
--   3. Cria a policy de isolamento em cada tabela:
--        - Usuario normal: SO ve/edita o proprio tenant
--        - superadmin: bypass (enxerga tudo)
--   4. Policy especial em "tenants" e "user_roles"
--
-- COMO RODAR: Supabase Dashboard > SQL Editor > colar > Run
-- DEPOIS: rodar scripts/qa/test_db_rls.mjs para confirmar que "4 passaram"
-- ============================================================================

-- 0) FUNCOES DE APOIO (idempotente)
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

-- 1) HABILITA RLS EM TODAS AS TABELAS DE TENANT
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holders ENABLE ROW LEVEL SECURITY;
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

-- 2) POLICIES DE ISOLAMENTO POR TENANT (tabelas com coluna tenant_id)
DO $$
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'plans', 'holders', 'dependents', 'contracts',
        'payments', 'financial_transactions', 'inventory',
        'chapel_burials', 'thanatopraxy_records', 'benefits_partners',
        'accounts_payable', 'asaas_customers', 'audit_logs',
        'chapel_bookings', 'collector_routes', 'commissions',
        'convalescence_items', 'convalescence_loans', 'vehicles',
        'fleet_vehicles', 'dispatches', 'dispatch_audit_logs',
        'emergency_dispatches', 'payment_carnets', 'regulatory_reserves'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_isolation" ON public.%I;', t, t);
        EXECUTE format('
            CREATE POLICY "%s_tenant_isolation" ON public.%I
            FOR ALL
            TO authenticated
            USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
            WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());
        ', t, t);
    END LOOP;
END $$;

-- 3) POLICY ESPECIAL EM "tenants": usuario ve SO o proprio; superadmin ve todos
DROP POLICY IF EXISTS "tenants_self_or_super" ON public.tenants;
CREATE POLICY "tenants_self_or_super" ON public.tenants
FOR ALL
TO authenticated
USING (id = public.get_user_tenant_id() OR public.is_superadmin())
WITH CHECK (id = public.get_user_tenant_id() OR public.is_superadmin());

-- 4) POLICY EM "user_roles": usuario ve apenas o proprio registro;
--    administradores continuam usando a API (service role) para gerenciar.
DROP POLICY IF EXISTS "user_roles_self_or_super" ON public.user_roles;
CREATE POLICY "user_roles_self_or_super" ON public.user_roles
FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id())
    OR public.is_superadmin()
);

-- 5) CONFERENCIA: deve listar as policies criadas por tabela
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;