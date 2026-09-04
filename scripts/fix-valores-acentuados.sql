-- ============================================================
-- NORMALIZAÇÃO DE VALORES GRAVADOS COM ACENTUAÇÃO QUEBRADA
-- Executar no Supabase SQL Editor (idempotente — pode rodar 2x)
-- v2: blocos defensivos — cada UPDATE só roda se a coluna existir
-- Motivo: o app gravou strings como 'Concludo', 'Disponivel',
-- 'Combustvel / Frota' antes da correção de encoding no front.
-- OBS: vehicles NÃO tem coluna 'type' (campo existe só no front).
-- ============================================================

-- 1) Veículos (usados por page.tsx e ordens de serviço)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='vehicles' AND column_name='status') THEN
    UPDATE public.vehicles SET status = 'Disponível' WHERE status IN ('Disponvel','Disponivel');
    UPDATE public.vehicles SET status = 'Em Missão'  WHERE status IN ('Em Misso','Em Missao');
    UPDATE public.vehicles SET status = 'Manutenção' WHERE status IN ('Manutenao','Manutencao');
  END IF;
END $$;

-- 2) Frota logística (fleet_vehicles — default lowercase no schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='fleet_vehicles' AND column_name='status') THEN
    UPDATE public.fleet_vehicles SET status = 'disponivel' WHERE status = 'Disponvel';
    UPDATE public.fleet_vehicles SET status = 'Em missão'  WHERE status IN ('Em Misso','Em Missao');
    UPDATE public.fleet_vehicles SET status = 'Manutenção' WHERE status IN ('Manutenao','Manutencao');
  END IF;
END $$;

-- 3) Comodato / Convalescença
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='convalescence_items' AND column_name='status') THEN
    UPDATE public.convalescence_items SET status = 'Disponível' WHERE status IN ('Disponvel','Disponivel');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='convalescence_items' AND column_name='item_name') THEN
    UPDATE public.convalescence_items SET item_name = 'Cadeira de Rodas Dobrável'
      WHERE item_name IN ('Cadeira de Rodas Dobrvel','Cadeira de Rodas Dobravel');
    UPDATE public.convalescence_items SET item_name = 'Andador de Alumínio'
      WHERE item_name IN ('Andador de Alumnio','Andador de Aluminio');
    UPDATE public.convalescence_items SET item_name = 'Véu de Renda Especial com Flores'
      WHERE item_name IN ('Vu de Renda Especial com Flores','Veu de Renda Especial com Flores');
  END IF;
END $$;

-- 4) Registros de óbito (status em maiúscula gravado pelo formulário)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='chapel_burials' AND column_name='status') THEN
    UPDATE public.chapel_burials SET status = 'Concluído' WHERE status IN ('Concludo','Concluido');
  END IF;
END $$;

-- 5) Estoque
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='inventory' AND column_name='category') THEN
    UPDATE public.inventory SET category = 'Ornamentação' WHERE category IN ('Ornamentao','Ornamentacao');
    UPDATE public.inventory SET category = 'Medicamentos & Farmácia' WHERE category = 'Medicamentos & Farmacia';
  END IF;
END $$;

-- 6) Lançamentos financeiros (categorias do select)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='financial_transactions' AND column_name='category') THEN
    UPDATE public.financial_transactions SET category = 'Combustível / Frota' WHERE category = 'Combustvel / Frota';
    UPDATE public.financial_transactions SET category = 'Serviço Funeral Avulso' WHERE category = 'Servico Funeral Avulso';
    UPDATE public.financial_transactions SET category = 'Cemitério & Taxas' WHERE category IN ('Cemitrio & Taxas','Cemiterio & Taxas');
  END IF;
END $$;

-- 7) Tanatopraxia (colunas podem ser technician/procedure OU technician_name/procedure_notes)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='thanatopraxy_records' AND column_name='technician') THEN
    UPDATE public.thanatopraxy_records SET technician = 'Dr. Roberto Tanatólogo'
      WHERE technician = 'Dr. Roberto Tanatlogo';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='thanatopraxy_records' AND column_name='procedure') THEN
    UPDATE public.thanatopraxy_records SET procedure = 'Aspiração e Formolização Padrão'
      WHERE procedure LIKE 'Aspira%Formoliza%Padr%' AND procedure <> 'Aspiração e Formolização Padrão';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='thanatopraxy_records' AND column_name='technician_name') THEN
    UPDATE public.thanatopraxy_records SET technician_name = 'Dr. Roberto Tanatólogo'
      WHERE technician_name = 'Dr. Roberto Tanatlogo';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='thanatopraxy_records' AND column_name='procedure_notes') THEN
    UPDATE public.thanatopraxy_records SET procedure_notes = 'Aspiração e Formolização Padrão'
      WHERE procedure_notes LIKE 'Aspira%Formoliza%Padr%' AND procedure_notes <> 'Aspiração e Formolização Padrão';
  END IF;
END $$;

-- ============ VERIFICAÇÃO (todas devem retornar 0) ============
SELECT 'vehicles' AS tabela, COUNT(*) AS pendentes FROM public.vehicles
  WHERE status IN ('Disponvel','Disponivel','Em Misso','Em Missao','Manutenao','Manutencao')
  UNION ALL
SELECT 'chapel_burials', COUNT(*) FROM public.chapel_burials WHERE status IN ('Concludo','Concluido')
  UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM public.financial_transactions WHERE category = 'Combustvel / Frota';
