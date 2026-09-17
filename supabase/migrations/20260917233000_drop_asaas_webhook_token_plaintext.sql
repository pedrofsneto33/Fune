-- Fase B: remove coluna plaintext asaas_webhook_token.
-- A Fase A adicionou asaas_webhook_token_hash (SHA-256) e migrou
-- o codigo. Fase B conclui removendo o plaintext.
-- ROLLBACK: restaurar do backup local
-- (backup-tenants-tokens-2026-09-17.txt em Desktop/Documents) e
-- reaplicar a migration 20260917230000.

ALTER TABLE "public"."tenants"
  DROP COLUMN IF EXISTS "asaas_webhook_token";
