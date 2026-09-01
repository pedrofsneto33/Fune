-- ============================================================
-- ETERNITYOS - MIGRACAO: Storage bucket para logos das filiais
-- Seguro para rodar multiplas vezes (idempotente).
-- ============================================================

-- 1) Cria o bucket publico onde o painel faz upload das logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Leitura publica (carteirinha/relatorios precisam exibir a logo)
DROP POLICY IF EXISTS "tenant_logos_public_read" ON storage.objects;
CREATE POLICY "tenant_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'tenant-logos');

-- 3) Upload apenas para usuarios autenticados
DROP POLICY IF EXISTS "tenant_logos_auth_write" ON storage.objects;
CREATE POLICY "tenant_logos_auth_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tenant-logos');

DROP POLICY IF EXISTS "tenant_logos_auth_update" ON storage.objects;
CREATE POLICY "tenant_logos_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'tenant-logos');

-- 4) VERIFICACAO: deve listar o bucket criado
SELECT id, name, public FROM storage.buckets;
