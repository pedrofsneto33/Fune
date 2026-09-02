-- PARTE 3/3 - LIMPEZA E RECRIAÇÃO COMPLETA DAS POLICIES
-- Rode DEPOIS das partes 1 e 2. Remove qualquer policy antiga/permissiva
-- que esteja permitindo vazamento, e recria as policies corretas.

-- 3.1) Remove TODAS as policies existentes dessas tabelas (evita OR entre policies antigas + novas)
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
        EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I;', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I;', t, t);
    END LOOP;
    EXECUTE 'DROP POLICY IF EXISTS "tenants_self_or_super" ON public.tenants;';
    EXECUTE 'DROP POLICY IF EXISTS "tenants_all" ON public.tenants;';
    EXECUTE 'DROP POLICY IF EXISTS "tenants_select" ON public.tenants;';
    EXECUTE 'DROP POLICY IF EXISTS "user_roles_self_or_super" ON public.user_roles;';
    EXECUTE 'DROP POLICY IF EXISTS "user_roles_all" ON public.user_roles;';
    EXECUTE 'DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;';
END $$;

-- 3.2) Recria de forma limpa (e apenas estas)
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
        EXECUTE format('
            CREATE POLICY "%s_tenant_isolation" ON public.%I
            FOR ALL
            TO authenticated
            USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
            WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());
        ', t, t);
    END LOOP;
END $$;

-- 3.3) Policy de tenants: somente o proprio OU superadmin
DROP POLICY IF EXISTS "tenants_self_or_super" ON public.tenants;
CREATE POLICY "tenants_self_or_super" ON public.tenants
FOR ALL
TO authenticated
USING (id = public.get_user_tenant_id() OR public.is_superadmin())
WITH CHECK (id = public.get_user_tenant_id() OR public.is_superadmin());

-- 3.4) user_roles: somente leitura do proprio registro
DROP POLICY IF EXISTS "user_roles_self_or_super" ON public.user_roles;
CREATE POLICY "user_roles_self_or_super" ON public.user_roles
FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id())
    OR public.is_superadmin()
);