/**
 * ============================================================
 * ETERNITYOS - Integracao Fiscal (NFS-e) via FocusNFe
 * ============================================================
 *
 * Estado atual: provedor ESCOLHIDO (FocusNFe). A chamada real vive em
 * src/lib/fiscal/focusnfe.ts (focusnfeEmit) e a rota POST /api/fiscal/emit
 * usa getFiscalConfig() + focusnfeEmit().
 *
 * Quando o tenant nao tem fiscal_provider configurado, getFiscalConfig()
 * retorna null e a rota responde 400 com orientacao.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type FiscalProvider = 'nfeio' | 'enotas' | 'focusnfe' | 'tecnospeed' | null;
export type FiscalEnvironment = 'sandbox' | 'production';
export type FiscalStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'rejected'
  | 'cancelled'
  | 'error';

export interface FiscalConfig {
  provider: FiscalProvider;
  environment: FiscalEnvironment;
  apiKey: string | null;
  companyDocument: string | null;
  companyName: string | null;
  companyIbgeCode: string | null;
  cnae: string | null;
  taxRegime: string | null;
  defaultServiceCode: string | null;
  defaultServiceDescription: string | null;
  defaultIssRate: number;
  autoEmit: boolean;
}

export interface FiscalEmitInput {
  tenantId: string;
  serviceOrderId: string;
  taker: {
    documentType: 'cpf' | 'cnpj';
    document: string;
    name: string;
    email?: string;
    phone?: string;
    zipCode?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  service: {
    code?: string;
    description: string;
    amount: number;
    deductionAmount?: number;
  };
}

/**
 * Le a configuracao fiscal do tenant.
 * Retorna null se o provedor nao estiver configurado.
 */
export async function getFiscalConfig(tenantId: string): Promise<FiscalConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select(`
      fiscal_provider,
      fiscal_environment,
      fiscal_api_key,
      fiscal_company_document,
      fiscal_company_name,
      fiscal_company_ibge_code,
      fiscal_cnae,
      fiscal_company_tax_regime,
      fiscal_default_service_code,
      fiscal_default_service_description,
      fiscal_default_iss_rate,
      fiscal_auto_emit
    `)
    .eq('id', tenantId)
    .single();

  if (error || !data) return null;
  if (!data.fiscal_provider) return null;

  return {
    provider: data.fiscal_provider as FiscalProvider,
    environment: (data.fiscal_environment || 'sandbox') as FiscalEnvironment,
    apiKey: data.fiscal_api_key,
    companyDocument: data.fiscal_company_document,
    companyName: data.fiscal_company_name,
    companyIbgeCode: data.fiscal_company_ibge_code,
    cnae: data.fiscal_cnae,
    taxRegime: data.fiscal_company_tax_regime,
    defaultServiceCode: data.fiscal_default_service_code,
    defaultServiceDescription: data.fiscal_default_service_description,
    defaultIssRate: Number(data.fiscal_default_iss_rate || 5),
    autoEmit: !!data.fiscal_auto_emit,
  };
}

