-- PARTE 1/2 - FUNCOES + HABILITAR RLS
-- Cole ISTO SOZINHO em um Query novo (botao New query) e rode.
-- Nao deve ter nenhum outro texto no editor.

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'superadmin'
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapel_burials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thanatopraxy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convalescence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convalescence_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_carnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_reserves ENABLE ROW LEVEL SECURITY;