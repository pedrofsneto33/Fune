-- ============================================================
-- NORMALIZAÇÃO DE VALORES GRAVADOS COM ACENTUAÇÃO QUEBRADA
-- Executar no Supabase SQL Editor (idempotente — pode rodar 2x)
-- Motivo: o app gravou strings como 'Concludo', 'Disponivel',
-- 'Combustvel / Frota' antes da correção de encoding no front.
-- ============================================================

-- Veículos (frota usada pelo page.tsx e ordens de serviço)
UPDATE public.vehicles SET status = 'Disponível' WHERE status IN ('Disponvel','Disponivel');
UPDATE public.vehicles SET status = 'Em Missão' WHERE status IN ('Em Misso','Em Missao');
UPDATE public.vehicles SET status = 'Manutenção' WHERE status IN ('Manutenao','Manutencao');
UPDATE public.vehicles SET type = 'Cortejo Fúnebre' WHERE type IN ('Cortejo Fnebre','Cortejo Funebre');
UPDATE public.vehicles SET type = 'Remoção Hospitalar' WHERE type IN ('Remoo Hospitalar','Remocao Hospitalar');

-- Frota logística (fleet_vehicles)
UPDATE public.fleet_vehicles SET status = 'Disponível' WHERE status IN ('Disponvel','Disponivel');
UPDATE public.fleet_vehicles SET status = 'Em Missão' WHERE status IN ('Em Misso','Em Missao');
UPDATE public.fleet_vehicles SET status = 'Manutenção' WHERE status IN ('Manutenao','Manutencao');

-- Comodato / Convalescença
UPDATE public.convalescence_items SET status = 'Disponível' WHERE status IN ('Disponvel','Disponivel');
UPDATE public.convalescence_items SET item_name = 'Cadeira de Rodas Dobrável'
  WHERE item_name IN ('Cadeira de Rodas Dobrvel','Cadeira de Rodas Dobravel');
UPDATE public.convalescence_items SET item_name = 'Andador de Alumínio'
  WHERE item_name IN ('Andador de Alumnio','Andador de Aluminio');
UPDATE public.convalescence_items SET item_name = 'Véu de Renda Especial com Flores'
  WHERE item_name IN ('Vu de Renda Especial com Flores','Veu de Renda Especial com Flores');

-- Registros de óbito (status gravado pelo formulário em maiúscula)
UPDATE public.chapel_burials SET status = 'Concluído' WHERE status IN ('Concludo','Concluido');

-- Estoque
UPDATE public.inventory SET category = 'Ornamentação' WHERE category IN ('Ornamentao','Ornamentacao');
UPDATE public.inventory SET category = 'Medicamentos & Farmácia' WHERE category IN ('Medicamentos & Farmacia');

-- Lançamentos financeiros (categorias do select)
UPDATE public.financial_transactions SET category = 'Combustível / Frota' WHERE category = 'Combustvel / Frota';
UPDATE public.financial_transactions SET category = 'Serviço Funeral Avulso' WHERE category IN ('Servico Funeral Avulso');
UPDATE public.financial_transactions SET category = 'Cemitério & Taxas' WHERE category IN ('Cemitrio & Taxas','Cemiterio & Taxas');

-- Tanatopraxia (defaults gravados pela API antes da correção)
UPDATE public.thanatopraxy_records SET technician = 'Dr. Roberto Tanatólogo'
  WHERE technician IN ('Dr. Roberto Tanatlogo');
UPDATE public.thanatopraxy_records SET procedure = 'Aspiração e Formolização Padrão'
  WHERE procedure LIKE 'Aspira%Formoliza%Padr%' AND procedure <> 'Aspiração e Formolização Padrão';

-- Verificação (deve retornar 0 linhas em cada query abaixo)
SELECT 'vehicles pendentes' AS chk, COUNT(*) FROM public.vehicles WHERE status LIKE '%vel' AND status <> 'Disponível';
