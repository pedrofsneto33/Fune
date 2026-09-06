-- ============================================================
-- Seguranca: decrement_stock passa a exigir tenant explicito
-- (defesa em profundidade para o RPC usado por /api/service-orders)
--
-- ANTES: decrement_stock(item_id uuid, qty integer) atualizava o estoque
--        apenas por id — um inventory_id de OUTRO tenant decrementaria
--        o estoque alheio (o RLS nao se aplica: SECURITY DEFINER).
-- AGORA: nova assinatura (p_item_id, p_tenant_id, qty) que so executa
--        quando o item pertence ao tenant informado pela API.
--
-- A assinatura antiga permanece como overload para compatibilidade;
-- a rota atualizada chama a nova. Rode este script no Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_stock(p_item_id uuid, p_tenant_id uuid, qty integer)
RETURNS void AS $$
BEGIN
  UPDATE public.inventory
  SET stock_quantity = stock_quantity - qty
  WHERE id = p_item_id AND tenant_id = p_tenant_id AND stock_quantity >= qty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Opcional, recomendado apos confirmar que nenhuma chamada usa mais a assinatura antiga)
-- DROP FUNCTION IF EXISTS public.decrement_stock(item_id uuid, qty integer);