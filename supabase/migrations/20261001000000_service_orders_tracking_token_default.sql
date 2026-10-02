-- service_orders: tracking_token sempre gerado no INSERT.
ALTER TABLE "public"."service_orders"
  ALTER COLUMN "tracking_token"
  SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Rede de segurança: cobre OS criadas entre a migration
-- 20260916010000 e esta (inclui o fallback sem token do POST).
UPDATE "public"."service_orders"
  SET "tracking_token" = replace(gen_random_uuid()::text, '-', '')
  WHERE "tracking_token" IS NULL;
