-- ============================================================
-- VERIFICACAO: estado da RLS / policies (apenas leitura)
-- Rode e cole o RESULTADO COMPLETO aqui no chat.
-- ============================================================

-- 1) RLS habilitada por tabela?
SELECT c.relname AS tabela,
       c.relrowsecurity AS rls_habilitada,
       c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('tenants','user_roles','plans','holders','dependents','contracts','payments','financial_transactions','inventory','vehicles')
ORDER BY c.relname;

-- 2) Policies existentes (todas, nas tabelas criticas)
SELECT p.tablename, p.policyname, p.cmd, p.roles, p.qual, p.with_check
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('tenants','user_roles','plans','holders')
ORDER BY p.tablename, p.policyname;

-- 3) Funcoes de apoio existem?
SELECT proname,
       pg_get_functiondef(oid) AS definicao
FROM pg_proc
WHERE proname IN ('get_user_tenant_id','is_superadmin')
ORDER BY proname;