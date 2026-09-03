-- PARTE 2: Remove policies permissivas (tabelas S-W) + verificação-- PARTE 2: Remove policies permissivas (tabelas S-W) + verificação
DROP POLICY IF EXISTS "auth_full_access_sales_commissions" ON sales_commissions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON sales_commissions;
DROP POLICY IF EXISTS "auth_full_access_stock_items" ON stock_items;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON stock_items;
DROP POLICY IF EXISTS "auth_full_access_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON stock_movements;
DROP POLICY IF EXISTS "service_role_all_thanatopraxy_records" ON thanatopraxy_records;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON thanatopraxy_records;
DROP POLICY IF EXISTS "thanatopraxy_policy" ON thanatopraxy_records;
DROP POLICY IF EXISTS "Permitir DELETE em vehicles" ON vehicles;
DROP POLICY IF EXISTS "Permitir INSERT em vehicles" ON vehicles;
DROP POLICY IF EXISTS "Permitir SELECT em vehicles" ON vehicles;
DROP POLICY IF EXISTS "Permitir UPDATE em vehicles" ON vehicles;
DROP POLICY IF EXISTS "service_role_all_vehicles" ON vehicles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON vehicles;
DROP POLICY IF EXISTS "service_role_all_wake_rooms" ON wake_rooms;
DROP POLICY IF EXISTS "tenant_isolation_insert_wake_rooms" ON wake_rooms;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON wake_rooms;
DROP POLICY IF EXISTS "tenant_isolation_select_wake_rooms" ON wake_rooms;
DROP POLICY IF EXISTS "tenant_isolation_update_wake_rooms" ON wake_rooms;
DROP POLICY IF EXISTS "Allow public all on webhook_logs" ON webhook_logs;

-- Verificação final
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename, policyname;