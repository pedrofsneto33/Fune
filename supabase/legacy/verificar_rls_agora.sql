-- ============================================================
-- VERIFICAR RLS - diagnostico definitivo (apenas leitura)
-- Rode em um query NOVO vazio. Cole o output COMPLETO aqui.
-- ============================================================

-- 1) RLS habilitada?
SELECT c.relname AS tabela, c.relrowsecurity AS rls_on
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('tenants','user_roles','holders','plans')
ORDER BY c.relname;

-- 2) Policies de cada tabela
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('tenants','user_roles','holders','plans')
ORDER BY tablename;

-- 3) As funcoes de apoio (definicao real)
SELECT proname, pg_get_functiondef(oid) AS def
FROM pg_proc
WHERE proname='get_user_tenant_id' OR proname='is_superadmin'
ORDER BY proname;