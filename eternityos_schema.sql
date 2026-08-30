-- ==========================================
-- ETERNITYOS - SCHEMA COMPLETO COM RLS E MULTI-TENANCY
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Empresas / Funerárias)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    asaas_api_key TEXT,
    asaas_webhook_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfis de Usuários e Permissões (RBAC)
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

-- 7. Pagamentos / Cobranças
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

-- 8. Transações Financeiras (Livro Caixa Único)
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

-- 12. Parceiros de Benefícios
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

-- Políticas de Isolamento por Tenant
DO $$
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'plans', 'holders', 'dependents', 'contracts', 
        'payments', 'financial_transactions', 'inventory', 
        'chapel_burials', 'thanatopraxy_records', 'benefits_partners'
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
