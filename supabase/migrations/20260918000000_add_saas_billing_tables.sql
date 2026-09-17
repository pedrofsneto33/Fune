-- Fase 1: tabelas de billing SaaS (EternityOS cobra o tenant).
-- O tenant tem 2 fluxos Asaas distintos:
--   1) associado -> funeraria (conta do tenant, ja existe)
--   2) funeraria -> EternityOS (conta da PRIMEX, esta fase)
-- Por isso tabelas separadas (nao mistura com payments/webhook_events).

CREATE TABLE "public"."saas_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  "plan" character varying NOT NULL CHECK ("plan" IN ('essencial','profissional','enterprise')),
  "status" character varying NOT NULL DEFAULT 'active'
    CHECK ("status" IN ('trial','active','past_due','suspended','canceled')),
  "valor" numeric(10,2) NOT NULL,
  "asaas_customer_id" character varying,
  "asaas_subscription_id" character varying UNIQUE,
  "next_due_date" date,
  "grace_until" timestamp with time zone,
  "trial_ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX "saas_subscriptions_tenant_id_idx"
  ON "public"."saas_subscriptions" ("tenant_id");

CREATE UNIQUE INDEX "saas_subscriptions_one_active_per_tenant"
  ON "public"."saas_subscriptions" ("tenant_id")
  WHERE "status" != 'canceled';

CREATE TABLE "public"."saas_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE SET NULL,
  "event" character varying NOT NULL,
  "asaas_payment_id" character varying,
  "payload" jsonb,
  "processed" boolean NOT NULL DEFAULT false,
  "processed_at" timestamp with time zone,
  "skipped_reason" text,
  "received_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX "saas_webhook_events_payment_event_idx"
  ON "public"."saas_webhook_events" ("asaas_payment_id", "event");

-- RLS: replica padrao multi-tenant do projeto (payments/contracts):
-- FOR ALL TO authenticated USING get_user_tenant_id() OR is_superadmin().
ALTER TABLE "public"."saas_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."saas_webhook_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_subscriptions_tenant_isolation"
  ON "public"."saas_subscriptions"
  FOR ALL
  TO "authenticated"
  USING (("tenant_id" = public.get_user_tenant_id()) OR public.is_superadmin())
  WITH CHECK (("tenant_id" = public.get_user_tenant_id()) OR public.is_superadmin());

CREATE POLICY "saas_webhook_events_tenant_isolation"
  ON "public"."saas_webhook_events"
  FOR ALL
  TO "authenticated"
  USING (("tenant_id" = public.get_user_tenant_id()) OR public.is_superadmin())
  WITH CHECK (("tenant_id" = public.get_user_tenant_id()) OR public.is_superadmin());