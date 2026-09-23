-- Fase A-2: funcao que grava/rotaciona/limpa a asaas_api_key via Vault.
-- Atomica: cria/atualiza secret, deleta o antigo, atualiza secret_id
-- no tenant. SECURITY DEFINER pra rodar como owner (acesso ao Vault).
-- p_key vazio/NULL limpa a chave (delete secret + zera coluna).

CREATE OR REPLACE FUNCTION public.set_asaas_api_key(
  p_tenant_id uuid,
  p_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  old_sid uuid;
  new_sid uuid;
BEGIN
  SELECT asaas_api_key_secret_id INTO old_sid
  FROM public.tenants
  WHERE id = p_tenant_id
  FOR UPDATE;

  IF old_sid IS NOT NULL THEN
    PERFORM vault.delete_secret(old_sid);
  END IF;

  IF p_key IS NULL OR LENGTH(TRIM(p_key)) = 0 THEN
    UPDATE public.tenants
      SET asaas_api_key_secret_id = NULL
      WHERE id = p_tenant_id;
    RETURN NULL;
  END IF;

  new_sid := vault.create_secret(
    TRIM(p_key),
    p_tenant_id::text || ':asaas_api_key',
    'Asaas API key do tenant ' || p_tenant_id::text
  );

  UPDATE public.tenants
    SET asaas_api_key_secret_id = new_sid
    WHERE id = p_tenant_id;

  RETURN new_sid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_asaas_api_key(uuid, text) TO service_role;
