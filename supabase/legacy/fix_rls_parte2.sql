-- PARTE 2/2 - POLICIES DE ISOLAMENTO
-- Cole isto em um Query NOVO (vazio) e rode DEPOIS da Parte 1.

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

-- Policy especial em "tenants": usuario ve SO o proprio; superadmin ve todos
DROP POLICY IF EXISTS "tenants_self_or_super" ON public.tenants;
CREATE POLICY "tenants_self_or_super" ON public.tenants
FOR ALL
TO authenticated
USING (id = public.get_user_tenant_id() OR public.is_superadmin())
WITH CHECK (id = public.get_user_tenant_id() OR public.is_superadmin());

-- Policy em "user_roles": usuario ve apenas o proprio registro
DROP POLICY IF EXISTS "user_roles_self_or_super" ON public.user_roles;
CREATE POLICY "user_roles_self_or_super" ON public.user_roles
FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id())
    OR public.is_superadmin()
);