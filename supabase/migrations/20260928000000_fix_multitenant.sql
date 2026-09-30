-- ============================================================
-- P0-3 — Correcoes de isolamento multi-tenant
-- ============================================================
-- Origem: auditoria 2026-09-28 do schema (20260914220043_remote_schema.sql).
--
--   (a) holders_cpf_key UNIQUE(cpf) era GLOBAL: impedia o mesmo CPF em duas
--       funerarias e vazava existencia de CPF de outro tenant (erro 23505).
--   (b) holders.tenant_id DEFAULT 'a0000000-0000-0000-0000-000000000001'
--       (tenant fantasma): INSERT sem tenant caia em outro tenant.
--       plans.tenant_id tinha o MESMO default (mesma classe de bug).
--   (c) sellers_tenant_isolation estava TO PUBLIC — deve ser TO authenticated.
--   (d) 5 tabelas com RLS ENABLED e NENHUMA policy (fail-closed silencioso):
--       leads, plans_orphans_backup, service_order_items, service_orders,
--       webhook_events.
--   (e) get_user_tenant_id() fazia LIMIT 1 sem ORDER BY: usuario com 2+
--       vinculos recebia tenant ARBITRARIO (dado cross-tenant na RLS).
--
-- Idempotente: pode reexecutar. NAO altera 20260914220043_remote_schema.sql.
-- ============================================================

-- (a) CPF unico POR TENANT -----------------------------------------------
ALTER TABLE public.holders DROP CONSTRAINT IF EXISTS holders_cpf_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'holders_cpf_tenant_unique'
  ) THEN
    ALTER TABLE public.holders
      ADD CONSTRAINT holders_cpf_tenant_unique UNIQUE (tenant_id, cpf);
  END IF;
END $$;

-- (b) remover DEFAULT hardcoded (tenant fantasma) ------------------------
ALTER TABLE public.holders ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE public.plans   ALTER COLUMN tenant_id DROP DEFAULT;

-- (c) sellers: PUBLIC -> authenticated -----------------------------------
DROP POLICY IF EXISTS sellers_tenant_isolation ON public.sellers;
CREATE POLICY sellers_tenant_isolation ON public.sellers
  FOR ALL
  TO authenticated
  USING ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin())
  WITH CHECK ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin());

-- (d) policies faltantes -------------------------------------------------
DROP POLICY IF EXISTS service_orders_tenant_isolation ON public.service_orders;
CREATE POLICY service_orders_tenant_isolation ON public.service_orders
  FOR ALL
  TO authenticated
  USING ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin())
  WITH CHECK ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin());

DROP POLICY IF EXISTS service_order_items_tenant_isolation ON public.service_order_items;
CREATE POLICY service_order_items_tenant_isolation ON public.service_order_items
  FOR ALL
  TO authenticated
  USING ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin())
  WITH CHECK ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin());

-- webhook_events.tenant_id e NULLABLE (evento pode chegar antes de resolver o
-- tenant); NULL so e visivel para superadmin.
DROP POLICY IF EXISTS webhook_events_tenant_isolation ON public.webhook_events;
CREATE POLICY webhook_events_tenant_isolation ON public.webhook_events
  FOR ALL
  TO authenticated
  USING ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin())
  WITH CHECK ((tenant_id = public.get_user_tenant_id()) OR public.is_superadmin());

-- leads (CRM/SaaS) e plans_orphans_backup NAO possuem coluna de tenant: sao
-- dados de plataforma/backup. Isolamento correto = somente superadmin.
DROP POLICY IF EXISTS leads_superadmin_only ON public.leads;
CREATE POLICY leads_superadmin_only ON public.leads
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS plans_orphans_backup_superadmin_only ON public.plans_orphans_backup;
CREATE POLICY plans_orphans_backup_superadmin_only ON public.plans_orphans_backup
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- (e) get_user_tenant_id(): sem LIMIT 1 arbitrario ------------------------
-- Ordem de resolucao:
--   1) tenant da sessao ativa (claim tenant_id do JWT), se houver vinculo;
--   2) vinculo unico -> esse tenant;
--   3) 2+ vinculos sem tenant na sessao -> ERRO explicito (fail-closed),
--      em vez de escolher um tenant aleatorio.
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $function$
DECLARE
  v_claims  json;
  v_session uuid;
  v_tenant  uuid;
  v_count   integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  -- 1) tenant da sessao ativa
  BEGIN
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  EXCEPTION WHEN others THEN
    v_claims := NULL;
  END;

  IF v_claims IS NOT NULL THEN
    BEGIN
      v_session := nullif(v_claims->>'tenant_id', '')::uuid;
    EXCEPTION WHEN others THEN
      v_session := NULL;
    END;
  END IF;

  IF v_session IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.tenant_id = v_session
  ) THEN
    RETURN v_session;
  END IF;

  -- 2) ambiguidade sem sessao: falha explicita (nunca escolhe "um" tenant)
  IF v_count > 1 THEN
    RAISE EXCEPTION
      'MULTI_TENANT_AMBIGUOUS: usuario % possui % vinculos ativos e nenhum tenant na sessao',
      auth.uid(), v_count
      USING ERRCODE = '21000';
  END IF;

  -- 3) vinculo unico
  SELECT ur.tenant_id INTO v_tenant
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid();

  RETURN v_tenant;
END;
$function$;

-- Verificacao (somente leitura) — tabelas com RLS e SEM policy devem dar 0:
-- SELECT c.relname
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
--   AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = c.relname)
-- ORDER BY 1;
