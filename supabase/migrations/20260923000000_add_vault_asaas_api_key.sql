-- Fase A-1: criptografar asaas_api_key via Supabase Vault.
-- Adiciona coluna que guarda o ID do secret no Vault (uuid).
-- Backfill cria um secret por tenant com a chave atual.
-- Funcao get_asaas_api_key() le do Vault (Security Definer).

ALTER TABLE "public"."tenants"
  ADD COLUMN "asaas_api_key_secret_id" uuid;

CREATE UNIQUE INDEX "tenants_asaas_api_key_secret_id_key"
  ON "public"."tenants" ("asaas_api_key_secret_id")
  WHERE "asaas_api_key_secret_id" IS NOT NULL;

DO $$
DECLARE
  t RECORD;
  sid uuid;
BEGIN
  FOR t IN
    SELECT id, name, asaas_api_key
    FROM public.tenants
    WHERE asaas_api_key IS NOT NULL
      AND LENGTH(TRIM(asaas_api_key)) > 0
      AND asaas_api_key_secret_id IS NULL
  LOOP
    sid := vault.create_secret(
      t.asaas_api_key,
      t.id::text || ':asaas_api_key',
      'Asaas API key do tenant ' || COALESCE(t.name, t.id::text)
    );
    UPDATE public.tenants
      SET asaas_api_key_secret_id = sid
      WHERE id = t.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_asaas_api_key(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT ds.decrypted_secret
  FROM vault.decrypted_secrets ds
  JOIN public.tenants t ON t.asaas_api_key_secret_id = ds.id
  WHERE t.id = p_tenant_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_asaas_api_key(uuid) TO service_role;
