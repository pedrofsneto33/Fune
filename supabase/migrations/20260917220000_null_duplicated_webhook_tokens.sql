-- Fase 0: remove duplicata de asaas_webhook_token entre
-- Matriz (real) e 2 tenants QA (teste, sem webhook).
-- A ambiguidade fazia o lookup .single() falhar (403) para
-- o token legitimo. Apenas os 2 QAs perdem o token.
UPDATE "public"."tenants"
  SET "asaas_webhook_token" = NULL
  WHERE "id" IN (
    'f87ebd29-8b44-407a-bcc9-38f40d4aa91a',
    '2340e1fc-ae85-43b9-b111-fe04238dd3e6'
  );
