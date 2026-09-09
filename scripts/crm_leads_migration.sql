-- ============================================================
-- CRM DE VENDAS DO ETERNITYOS (interno do operador do SaaS)
-- Leads NÃO são dados de tenant: pertencem a quem vende o sistema.
-- RLS ativada SEM policies: nenhum client (anon/authenticated) enxerga;
-- apenas service role (rotas /api/leads com withAuth superadmin).
-- RODAR NO SUPABASE SQL EDITOR (idempotente).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    city VARCHAR(100),
    uf VARCHAR(2),
    phone VARCHAR(25),
    email VARCHAR(150),
    source VARCHAR(30) NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'landing', 'indicacao', 'outbound')),
    stage VARCHAR(30) NOT NULL DEFAULT 'novo'
        CHECK (stage IN ('novo', 'contato', 'demo', 'proposta', 'ganho', 'perdido')),
    estimated_monthly NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (estimated_monthly >= 0),
    next_follow_up DATE,
    notes TEXT,
    lost_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON public.leads(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
