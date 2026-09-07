-- ============================================================
-- ETERNITYOS - NFS-e (Nota Fiscal de Servico Eletronica)
-- FASE 1: Estrutura preparada (sem integracao com provedor ainda)
-- Rodar no Supabase SQL Editor. Idempotente.
-- ============================================================
--
-- Esta migration deixa o sistema PRONTO para emissao de NFS-e
-- assim que o provedor for escolhido (NFE.io, eNotas, FocusNFe,
-- Tecnospeed, etc.). Apenas cria a estrutura, RLS e indices.
-- Nenhuma integracao externa e ativada aqui.

-- 1) Tabela de historico de NFS-e (uma linha por tentativa de emissao)
CREATE TABLE IF NOT EXISTS public.fiscal_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,

  -- Dados do provedor (preenchidos quando integracao existir)
  provider text,                          -- 'nfeio' | 'enotas' | 'focusnfe' | 'tecnospeed' | etc
  provider_invoice_id text,               -- id interno do provedor
  provider_environment text DEFAULT 'sandbox' CHECK (provider_environment IN ('sandbox','production')),

  -- Dados da NFS-e retornados pela prefeitura
  nfse_number text,                       -- numero da NFS-e (ex: "12345")
  nfse_verification_code text,            -- codigo de verificacao da prefeitura
  nfse_status text NOT NULL DEFAULT 'pending'
    CHECK (nfse_status IN (
      'pending',                          -- criada, aguardando envio
      'processing',                       -- enviada, aguardando prefeitura autorizar
      'authorized',                       -- autorizada pela prefeitura
      'rejected',                         -- rejeitada pela prefeitura
      'cancelled',                        -- cancelada (NF-e de cancelamento emitida)
      'error'                             -- erro tecnico no provedor
    )),

  -- Tomador (cliente da funeraria que contratou o servico)
  taker_document_type text CHECK (taker_document_type IN ('cpf','cnpj')),
  taker_document text,                    -- CPF ou CNPJ
  taker_name text NOT NULL,
  taker_email text,
  taker_phone text,
  taker_zip_code text,
  taker_address text,
  taker_number text,
  taker_complement text,
  taker_neighborhood text,
  taker_city text,
  taker_state text,

  -- Servico
  service_code text,                      -- codigo na lista de servicos municipal (LCS)
  service_description text NOT NULL,     -- descricao do servico prestado
  service_amount numeric(12,2) NOT NULL,  -- valor do servico
  deduction_amount numeric(12,2) DEFAULT 0, -- valor de deducao (se houver)
  tax_rate numeric(5,2),                  -- aliquota ISS em % (ex: 5.00)
  iss_amount numeric(12,2),               -- valor ISS calculado
  taxable_amount numeric(12,2),           -- base de calculo

  -- Reforma Tributaria (IBS/CBS) - campos a partir de 01/10/2026
  cst text,                               -- Codigo de Situacao Tributaria
  c_class_trib text,                      -- Classificacao Tributaria
  ind_natureza_op text,                   -- Indicador Natureza da Operacao
  v_bc_ibs_cbs numeric(12,2),             -- Base de calculo IBS/CBS
  p_ibs_cbs numeric(5,2),                 -- Aliquota IBS/CBS em %
  v_ibs numeric(12,2),                    -- Valor IBS
  v_cbs numeric(12,2),                    -- Valor CBS

  -- Retorno do provedor
  provider_request_payload jsonb,          -- payload enviado (debug)
  provider_response_payload jsonb,        -- resposta completa (debug)
  provider_error_message text,            -- mensagem de erro se houver

  -- URLs geradas pelo provedor
  pdf_url text,
  xml_url text,

  -- Cancelamento
  cancelled_at timestamptz,
  cancelled_by_user_id uuid,
  cancellation_reason text,               -- justificativa obrigatoria pra cancelar
  cancellation_nfse_number text,          -- numero da NF-e de cancelamento

  -- Auditoria
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  issued_at timestamptz                   -- momento em que a prefeitura autorizou
);

-- 2) Indices
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_tenant ON public.fiscal_invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_service_order ON public.fiscal_invoices (service_order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_status ON public.fiscal_invoices (tenant_id, nfse_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_created_at ON public.fiscal_invoices (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_nfse_number ON public.fiscal_invoices (tenant_id, nfse_number);

-- 3) RLS: isolamento por tenant
ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscal_invoices_tenant_isolation" ON public.fiscal_invoices;
CREATE POLICY "fiscal_invoices_tenant_isolation" ON public.fiscal_invoices
  FOR ALL
  USING ((tenant_id = get_user_tenant_id()) OR is_superadmin())
  WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_superadmin());

-- 4) Colunas em service_orders para vinculo rapido (sem precisar de JOIN)
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS nfse_id uuid REFERENCES public.fiscal_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nfse_status text
    CHECK (nfse_status IN ('pending','processing','authorized','rejected','cancelled','error','not_applicable')),
  ADD COLUMN IF NOT EXISTS nfse_required boolean NOT NULL DEFAULT true;

-- 5) Colunas de configuracao fiscal em tenants (por funeraria)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS fiscal_provider text,
  ADD COLUMN IF NOT EXISTS fiscal_environment text DEFAULT 'sandbox'
    CHECK (fiscal_environment IN ('sandbox','production')),
  ADD COLUMN IF NOT EXISTS fiscal_api_key text,
  ADD COLUMN IF NOT EXISTS fiscal_company_document text,
  ADD COLUMN IF NOT EXISTS fiscal_company_name text,
  ADD COLUMN IF NOT EXISTS fiscal_company_zip text,
  ADD COLUMN IF NOT EXISTS fiscal_company_address text,
  ADD COLUMN IF NOT EXISTS fiscal_company_number text,
  ADD COLUMN IF NOT EXISTS fiscal_company_neighborhood text,
  ADD COLUMN IF NOT EXISTS fiscal_company_city text,
  ADD COLUMN IF NOT EXISTS fiscal_company_state text,
  ADD COLUMN IF NOT EXISTS fiscal_company_phone text,
  ADD COLUMN IF NOT EXISTS fiscal_company_email text,
  ADD COLUMN IF NOT EXISTS fiscal_company_ibge_code text,
  ADD COLUMN IF NOT EXISTS fiscal_company_tax_regime text
    CHECK (fiscal_company_tax_regime IN ('simples_nacional','lucro_presumido','lucro_real','mei')),
  ADD COLUMN IF NOT EXISTS fiscal_cnae text,
  ADD COLUMN IF NOT EXISTS fiscal_default_service_code text,
  ADD COLUMN IF NOT EXISTS fiscal_default_service_description text,
  ADD COLUMN IF NOT EXISTS fiscal_default_iss_rate numeric(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS fiscal_auto_emit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fiscal_last_test_at timestamptz,
  ADD COLUMN IF NOT EXISTS fiscal_last_test_status text;

-- 6) Comentarios para documentacao
COMMENT ON TABLE public.fiscal_invoices IS 'Historico de tentativas de emissao de NFS-e. Cada servico funerario concluido pode gerar uma NFS-e (Lei Municipal + Reforma Tributaria IBS/CBS).';
COMMENT ON COLUMN public.fiscal_invoices.nfse_status IS 'Status: pending (criada, nao enviada), processing (enviada, aguardando prefeitura), authorized, rejected, cancelled, error.';
COMMENT ON COLUMN public.fiscal_invoices.cst IS 'Codigo de Situacao Tributaria - Reforma Tributaria (obrigatorio a partir de 01/10/2026).';
COMMENT ON COLUMN public.tenants.fiscal_provider IS 'Provedor de NFS-e: nfeio, enotas, focusnfe, tecnospeed. NULL = emissao desabilitada.';
COMMENT ON COLUMN public.tenants.fiscal_auto_emit IS 'Se true, emite NFS-e automaticamente quando uma OS e concluida. Se false, fica como pendente para emissao manual.';

-- 7) View utilitaria: ordens de servico concluidas SEM NFS-e emitida
CREATE OR REPLACE VIEW public.v_service_orders_without_nfse AS
SELECT
  so.id,
  so.tenant_id,
  so.contract_id,
  so.deceased_name,
  so.total_amount,
  so.burial_date,
  so.created_at,
  so.nfse_required
FROM public.service_orders so
WHERE so.status = 'completed'
  AND so.nfse_required = true
  AND so.nfse_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.fiscal_invoices fi
    WHERE fi.service_order_id = so.id
      AND fi.nfse_status IN ('pending','processing','authorized')
  );
