-- Fase 12b-1: token de rastreamento publico por OS (QR /track/[token]).
-- Token e a credencial da rota publica (nao CPF, nao UUID adivinhavel).
-- Nullable: OS antigas recebem backfill abaixo; novas sao geradas no POST.
ALTER TABLE "public"."service_orders"
  ADD COLUMN "tracking_token" character varying(32);

CREATE UNIQUE INDEX "service_orders_tracking_token_key"
  ON "public"."service_orders" ("tracking_token")
  WHERE "tracking_token" IS NOT NULL;

-- Backfill: 32 chars hex (url-safe) para todas as OS existentes.
UPDATE "public"."service_orders"
  SET "tracking_token" = replace(gen_random_uuid()::text, '-', '')
  WHERE "tracking_token" IS NULL;
