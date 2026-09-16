-- Fase 13a: persistir o responsavel (cliente avulso / balcao) na OS.
-- Todas nullable: OS de associado (holder/dependent) segue enviando NULL.
ALTER TABLE "public"."service_orders"
  ADD COLUMN "responsavel_name"  character varying(255),
  ADD COLUMN "responsavel_cpf"   character varying(11),
  ADD COLUMN "responsavel_phone" character varying(20),
  ADD COLUMN "responsavel_email" character varying(255);
