-- ============================================================
-- P0-2 — Token opaco da carteirinha digital
-- ============================================================
-- A rota publica /carteirinha/[cpf] consultava `holders` por CPF com a service
-- role: enumerar CPFs devolvia nome, CPF, contrato, plano e dependentes de
-- QUALQUER tenant. O CPF nao pode ser credencial (espaco de 10^11, baixa
-- entropia e publico por natureza).
--
-- Aqui entra `carteirinha_token`: uuid v4 (122 bits de entropia), unico e
-- revogavel por titular. O lookup da pagina passa a ser
-- `.eq('carteirinha_token', token)` — nunca mais por CPF.
--
-- Bootstrap: como o token e derivado no banco, use
--   GET /api/holders (autenticado) -> campo `carteirinha_token`
-- e monte o link `/carteirinha/<cpf>?t=<token>`. O proprio path do CPF pode
-- ser '0' (ex.: /carteirinha/0?t=<token>): a pagina resolve pelo token e exibe
-- o link canonico correto no QR Code / WhatsApp.
--
-- Rotacao (revogar um link vazado):
--   UPDATE public.holders SET carteirinha_token = gen_random_uuid() WHERE id = '<id>';
--
-- Idempotente: pode reexecutar.
-- ============================================================

-- gen_random_uuid() e VOLATILE: cada linha existente recebe um valor distinto.
ALTER TABLE public.holders
  ADD COLUMN IF NOT EXISTS carteirinha_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Seguranca para bases onde a coluna tenha sido criada sem default/unicidade
UPDATE public.holders
   SET carteirinha_token = gen_random_uuid()
 WHERE carteirinha_token IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'holders_carteirinha_token_key'
  ) THEN
    ALTER TABLE public.holders
      ADD CONSTRAINT holders_carteirinha_token_key UNIQUE (carteirinha_token);
  END IF;
END $$;

-- Indice de busca do lookup publico (a UNIQUE ja cria um, mantido explicito
-- aqui apenas se a constraint acima for removida no futuro).
CREATE INDEX IF NOT EXISTS idx_holders_carteirinha_token
  ON public.holders (carteirinha_token);
