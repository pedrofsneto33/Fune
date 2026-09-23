-- B-1: campos dedicados no CRM (rating, reviews, address, website).
-- Hoje esses dados vivem empacotados em `notes` como string
-- ("Rating: X | Reviews: N | Endereco: Y | Site: Z"). Separar
-- permite ordenar por rating, filtrar por bairro, linkar site.
-- Colunas nullable: nao quebram dados existentes.

ALTER TABLE "public"."leads"
  ADD COLUMN "rating" numeric(2,1),
  ADD COLUMN "reviews_count" integer,
  ADD COLUMN "address" text,
  ADD COLUMN "website" text;

ALTER TABLE "public"."leads"
  ADD CONSTRAINT "leads_rating_check" CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 5)),
  ADD CONSTRAINT "leads_reviews_count_check" CHECK ("reviews_count" IS NULL OR "reviews_count" >= 0);
