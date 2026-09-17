-- Fase A: hash SHA-256 do asaas_webhook_token.
-- Mantem a coluna plaintext durante a transicao (rollback via
-- revert de codigo). Fase B futura dropa a plaintext.
-- Token tem >=16 chars de entropia -> SHA-256 puro (sem salt)
-- e suficiente; lookup e por igualdade de hash (indexavel).
-- NOTA: pgcrypto mora no schema `extensions` no Supabase;
-- por isso `extensions.digest(...)` (search_path da conexao
-- direta do db push nao inclui `extensions`).

ALTER TABLE "public"."tenants"
  ADD COLUMN "asaas_webhook_token_hash" text;

UPDATE "public"."tenants"
  SET "asaas_webhook_token_hash" =
    encode(extensions.digest("asaas_webhook_token", 'sha256'), 'hex')
  WHERE "asaas_webhook_token" IS NOT NULL;

CREATE UNIQUE INDEX "tenants_asaas_webhook_token_hash_key"
  ON "public"."tenants" ("asaas_webhook_token_hash")
  WHERE "asaas_webhook_token_hash" IS NOT NULL;
