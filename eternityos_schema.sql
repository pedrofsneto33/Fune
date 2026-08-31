-- ==========================================
-- ETERNITYOS - SCHEMA COMPLETO COM RLS E MULTI-TENANCY
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Empresas / Funerarias)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    asaas_api_key TEXT,
    asaas_webhook_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfis de Usuarios e Permissoes (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'manager', 'attendant', 'driver', 'financial')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, tenant_id)
);

-- 3. Planos
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    monthly_fee NUMERIC(10,2) NOT NULL CHECK (monthly_fee >= 0),
    max_dependents INT NOT NULL DEFAULT 4,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Titulares
CREATE TABLE IF NOT EXISTS public.holders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, cpf)
);

-- 5. Dependentes
CREATE TABLE IF NOT EXISTS public.dependents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    holder_id UUID NOT NULL REFERENCES public.holders(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    relation VARCHAR(50) NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    holder_id UUID NOT NULL REFERENCES public.holders(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'grace_period', 'defaulted', 'cancelled')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pagamentos / Cobrancas
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    asaas_payment_id VARCHAR(100) UNIQUE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'boleto', 'credit_card', 'cash')),
    pix_code TEXT,
    pix_qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Transacoes Financeiras (Livro Caixa Unico)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Estoque
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_threshold INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Capela e Sepultamentos
CREATE TABLE IF NOT EXISTS public.chapel_burials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    deceased_name VARCHAR(255) NOT NULL,
    burial_date TIMESTAMPTZ NOT NULL,
    cemetery_location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tanatopraxia
CREATE TABLE IF NOT EXISTS public.thanatopraxy_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    burial_id UUID REFERENCES public.chapel_burials(id) ON DELETE CASCADE,
    technician_name VARCHAR(255) NOT NULL,
    procedure_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Parceiros de Beneficios
CREATE TABLE IF NOT EXISTS public.benefits_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    partner_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    discount_percentage NUMERIC(5,2),
    contact_info TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Contas a Pagar
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Clientes Asaas (vinculo contrato <-> cliente no gateway)
CREATE TABLE IF NOT EXISTS public.asaas_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    asaas_customer_id VARCHAR(100) NOT NULL,
    billing_type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Logs de Auditoria Gerais
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    user_email VARCHAR(255),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Agendamento de Capela / Velorio
CREATE TABLE IF NOT EXISTS public.chapel_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    chapel_name VARCHAR(150) NOT NULL,
    deceased_name VARCHAR(255) NOT NULL,
    family_contact VARCHAR(100),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'reservado',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Rotas de Cobranca Presencial
CREATE TABLE IF NOT EXISTS public.collector_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    collector_name VARCHAR(150) NOT NULL,
    zone VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    total_receipts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Comissoes de Vendedores
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    seller_name VARCHAR(150) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Itens de Comodato (Convalescenca)
CREATE TABLE IF NOT EXISTS public.convalescence_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'Disponivel',
    condition VARCHAR(30) NOT NULL DEFAULT 'Bom',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Emprestimos de Comodato (Convalescenca)
CREATE TABLE IF NOT EXISTS public.convalescence_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.convalescence_items(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    holder_name VARCHAR(255) NOT NULL,
    holder_cpf VARCHAR(14),
    holder_phone VARCHAR(20),
    beneficiary_name VARCHAR(255),
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    deposit_amount NUMERIC(10,2) DEFAULT 0,
    cleaning_fee NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    return_condition VARCHAR(30),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Frota (Veiculos)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plate VARCHAR(15),
    model VARCHAR(150),
    odometer NUMERIC(10,1) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Disponivel',
    last_maintenance_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTA: existe tambem 'fleet_vehicles', usado por ModalFleetLogistics.tsx,
-- que parece modelar o mesmo conceito de veiculo de frota que 'vehicles'
-- (usado por dispatches/close). Criada aqui separada para nao quebrar o
-- codigo existente, mas recomenda-se consolidar as duas em uma so depois.
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plate VARCHAR(15) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'disponivel',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Despachos / Missoes de Remocao
CREATE TABLE IF NOT EXISTS public.dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(15),
    driver_agent VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'Em andamento',
    odometer_start NUMERIC(10,1),
    odometer_end NUMERIC(10,1),
    km_traveled NUMERIC(10,1),
    fuel_liters_added NUMERIC(10,2) DEFAULT 0,
    fuel_cost NUMERIC(10,2) DEFAULT 0,
    closure_notes TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Log de Auditoria de Despachos
CREATE TABLE IF NOT EXISTS public.dispatch_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    dispatch_id UUID,
    action VARCHAR(100) NOT NULL,
    actor_name VARCHAR(150),
    actor_role VARCHAR(50),
    vehicle_plate VARCHAR(15),
    driver_name VARCHAR(150),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Missoes de Emergencia / Plantao 24h
CREATE TABLE IF NOT EXISTS public.emergency_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Em andamento',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Carnes de Pagamento (parcelamento anual)
CREATE TABLE IF NOT EXISTS public.payment_carnets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    total_installments INT NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Reservas Regulatorias (Lei 13.261/2016)
CREATE TABLE IF NOT EXISTS public.regulatory_reserves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL,
    applied_amount NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'calculado',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, reference_month)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

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

-- Habilitar RLS em todas as tabelas
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

-- Politicas de Isolamento por Tenant
DO $$
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'plans', 'holders', 'dependents', 'contracts',
        'payments', 'financial_transactions', 'inventory',
        'chapel_burials', 'thanatopraxy_records', 'benefits_partners',
        'accounts_payable', 'asaas_customers', 'audit_logs',
        'chapel_bookings', 'collector_routes', 'commissions',
        'convalescence_items', 'convalescence_loans', 'vehicles',
        'fleet_vehicles', 'dispatches', 'dispatch_audit_logs',
        'emergency_dispatches', 'payment_carnets', 'regulatory_reserves'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_isolation" ON public.%I;', t, t);
        EXECUTE format('
            CREATE POLICY "%s_tenant_isolation" ON public.%I
            FOR ALL
            TO authenticated
            USING (tenant_id = public.get_user_tenant_id() OR public.is_superadmin())
            WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_superadmin());
        ', t, t);
    END LOOP;
END $$;
