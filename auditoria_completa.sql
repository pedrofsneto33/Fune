-- AUDITORIA COMPLETA DE SEGURANÇA
-- 1) Todas as tabelas públicas
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;

-- 2) RLS status de cada tabela
SELECT relname as tabela, relrowsecurity as rls_ativa FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' ORDER BY relname;

-- 3) Tabelas que TEM coluna tenant_id
SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND column_name='tenant_id' ORDER BY table_name;

-- 4) Policies de TODAS as tabelas
SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;