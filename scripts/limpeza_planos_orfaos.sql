-- ============================================================
-- ETERNITYOS - LIMPEZA: planos orfaos da auto-criacao antiga
-- Contexto: a logica antiga (.ilike) criava "Familiar Ouro" sem
-- tenant_id a cada cadastro. Diagnostico confirmou 11 orfaos com
-- 0 contratos vinculados.
-- Seguro: trava se houver contrato orfao + backup jsonb antes.
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================

-- 0) TRAVA DE SEGURANCA: aborta TUDO se algum contrato apontar
--    para plano orfao (neste cenario confirmado: 0 contratos).
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v
  FROM public.contracts c
  JOIN public.plans p ON p.id = c.plan_id
  WHERE p.tenant_id IS NULL;
  IF v > 0 THEN
    RAISE EXCEPTION 'EXISTEM % contrato(s) apontando para plano orfao. Re-vinque os contratos antes de apagar.', v;
  END IF;
END $$;

-- 1) Backup dos orfaos em JSONB (sem depender de tipos de coluna)
CREATE TABLE IF NOT EXISTS public.plans_orphans_backup (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  backed_up_at timestamptz DEFAULT now()
);

INSERT INTO public.plans_orphans_backup (id, data)
SELECT id, to_jsonb(p)
FROM public.plans p
WHERE p.tenant_id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2) Apagar os orfaos
DELETE FROM public.plans WHERE tenant_id IS NULL;

-- 3) VERIFICACAO final
SELECT count(*) AS planos_orfaos_restantes
FROM public.plans WHERE tenant_id IS NULL;

-- Catalogo final (deve conter apenas planos com tenant valido)
SELECT id, tenant_id, name, monthly_fee, max_dependents
FROM public.plans ORDER BY created_at;