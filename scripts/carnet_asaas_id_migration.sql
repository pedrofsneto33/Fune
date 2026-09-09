-- ============================================================
-- RASTREABILIDADE ASAAS ↔ CARNÊ
-- Adiciona coluna para salvar o ID do pagamento no Asaas
-- em cada parcela do carnê.
-- ============================================================

ALTER TABLE public.payment_carnets
  ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_payment_carnets_asaas_id
  ON public.payment_carnets(asaas_payment_id);
