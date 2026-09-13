-- ============================================================
-- RASTREABILIDADE OS ↔ VENDA AVULSA
-- Vincula financial_transactions a service_orders via FK.
-- RODAR NO SUPABASE SQL EDITOR (idempotente).
-- ============================================================

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_service_order
  ON public.financial_transactions(service_order_id);
