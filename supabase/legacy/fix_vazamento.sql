-- ============================================================
-- CORREÇÃO DEFINITIVA: remove policies permissivas que causam vazamento
-- Mantém apenas as policies de isolamento por tenant
-- ============================================================

-- 1) HOLDERS: remove policies permissivas
DROP POLICY IF EXISTS "Permitir leitura holders" ON holders;
DROP POLICY IF EXISTS "Permitir leitura publica" ON holders;
DROP POLICY IF EXISTS "auth_full_access_holders" ON holders;

-- 2) PLANS: remove policies permissivas
DROP POLICY IF EXISTS "Permitir leitura plans" ON plans;
DROP POLICY IF EXISTS "Permitir leitura publica" ON plans;
DROP POLICY IF EXISTS "anon_read_plans" ON plans;
DROP POLICY IF EXISTS "auth_full_access_plans" ON plans;

-- 3) TENANTS: remove policies permissivas
DROP POLICY IF EXISTS "anon_read_tenants" ON tenants;
DROP POLICY IF EXISTS "auth_full_access_tenants" ON tenants;

-- 4) Verificação final: policies restantes
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('tenants','user_roles','holders','plans')
ORDER BY tablename, policyname;
