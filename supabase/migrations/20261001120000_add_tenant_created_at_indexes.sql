-- Índices compostos para ORDER BY created_at DESC dentro de tenant_id.
-- Queries afetadas: GET /api/holders (linha ~52) e GET /api/service-orders
-- (linha ~19), ambas com .eq('tenant_id', ...).order('created_at', {ascending:false}).
-- Sem o composto, o planner usa idx_*_tenant e ordena em memória.
CREATE INDEX IF NOT EXISTS idx_holders_tenant_created_at
  ON public.holders (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_orders_tenant_created_at
  ON public.service_orders (tenant_id, created_at DESC);
