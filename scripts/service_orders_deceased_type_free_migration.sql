-- Atualiza CHECK constraint para deceased_type na tabela service_orders para incluir 'free' (cobrança avulsa)
ALTER TABLE service_orders
  DROP CONSTRAINT IF EXISTS service_orders_deceased_type_check,
  ADD CONSTRAINT service_orders_deceased_type_check
    CHECK (deceased_type IN ('holder', 'dependent', 'free'));