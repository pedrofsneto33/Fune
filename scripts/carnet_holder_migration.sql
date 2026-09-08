-- ============================================================
-- ETERNITYOS - Corrigir payment_carnets para salvar dados do titular
-- Migration para adicionar holder_name e holder_cpf na tabela payment_carnets
-- Rodar no Supabase SQL Editor. Idempotente.
-- ============================================================

-- Adicionar coluna holder_name (nome do titular no momento da geracao)
ALTER TABLE public.payment_carnets
  ADD COLUMN IF NOT EXISTS holder_name VARCHAR(255);

-- Adicionar coluna holder_cpf (CPF do titular no momento da geracao)
ALTER TABLE public.payment_carnets
  ADD COLUMN IF NOT EXISTS holder_cpf VARCHAR(14);

-- Comentarios para documentacao
COMMENT ON COLUMN public.payment_carnets.holder_name IS 'Nome do titular no momento da geracao do carnê (desnormalizado para facilitar consultas).';
COMMENT ON COLUMN public.payment_carnets.holder_cpf IS 'CPF do titular no momento da geracao do carnê (desnormalizado para facilitar consultas).';
