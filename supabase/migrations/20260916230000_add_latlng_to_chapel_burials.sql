-- Fase 12d-1: adiciona coordenadas geograficas aos sepultamentos.
-- Colunas nullable — registros antigos ficam sem coordenada ate
-- backfill manual ou geocoding (fora do escopo desta sub-fase).

ALTER TABLE "public"."chapel_burials"
  ADD COLUMN "latitude" double precision,
  ADD COLUMN "longitude" double precision;
