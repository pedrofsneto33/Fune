-- ============================================================
-- HARDENING DO BUCKET DE LOGOS (tenant-logos)
-- RODE NO SUPABASE: Dashboard > SQL Editor > cole e execute.
-- Motivo: o upload de logo agora acontece via rota de API
-- (src/app/api/tenants/logo) usando a service role, que ignora RLS.
-- Logo, o bucket nao precisa aceitar upload direto com a chave anonima.
-- ============================================================

-- 1) Remove politicas permissivas que possam ter sido criadas antes
DROP POLICY IF EXISTS "Give users access to own folder logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upsert logos" ON storage.objects;

-- 2) Garante que RLS esta ativa (padrao do Supabase, mas idempotente)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3) Leitura publica permitida para exibir a imagem no app
CREATE POLICY "Public read tenant-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tenant-logos');

-- 4) SEM policies de INSERT/UPDATE/DELETE para anon/authenticated:
--    com RLS ativa e sem policy, qualquer acesso pela chave anonima
--    e bloqueado. Somente a service role (via /api/tenants/logo)
--    consegue gravar no bucket.

-- Verificacao: rode depois
-- SELECT policyname, command, roles FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';