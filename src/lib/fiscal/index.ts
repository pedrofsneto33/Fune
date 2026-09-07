/**
 * ============================================================
 * ETERNITYOS - Integracao Fiscal (NFS-e)
 * ============================================================
 *
 * Stub / esqueleto da camada de integracao com provedores
 * de NFS-e (Nota Fiscal de Servico Eletronica).
 *
 * Estado atual: NENHUM provedor foi escolhido ainda, entao este
 * modulo nao faz chamadas externas. A estrutura de banco
 * (tabela public.fiscal_invoices + colunas em service_orders
 * + colunas de config em tenants) ja esta pronta.
 *
 * Quando voce escolher o provedor, vai preencher:
 *   - fiscalProvider: 'nfeio' | 'enotas' | 'focusnfe' | 'tecnospeed' | ...
 *   - fiscalApiKey: chave de API do provedor
 *   - fiscalEnvironment: 'sandbox' | 'production'
 *
 * Recomendacao de provedor (apos analise):
 *   - NFE.io: simples, API REST moderna, ~R$ 0,30 por NFS-e
 *   - eNotas: mais barato (~R$ 0,15), UI propria
 *   - FocusNFe: barato, integra com 100+ prefeituras
 *   - Tecnospeed: maior do mercado (~60% share), padrao para automacao comercial
 *
 * Proximos passos quando decidir o provedor:
 *   1. Criar src/lib/fiscal/<provider>.ts com a chamada HTTP
 *   2. Implementar mapServiceOrderToPayload() abaixo
 *   3. Implementar emitNfse(), cancelNfse() e getNfse()
 *   4. Criar rotas API em src/app/api/fiscal/* para chamar daqui
 *   5. Adicionar bloco "Configuracao Fiscal" no TenantSettingsTab
 *   6. Criar aba "Fiscal" no menu lateral
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString } from '@/lib/validation';

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

/**
 * Stub de emissao de NFS-e. Substituir pelo provedor escolhido.
 *
 * @returns numero da NFS-e, codigo de verificacao e URLs de PDF/XML
 * @throws Error com mensagem amigavel se provedor nao configurado ou emissao falhar
 */
export async function emitNfse(
  config: FiscalConfig,
  input: FiscalEmitInput
): Promise<{ nfseNumber: string; verificationCode: string; pdfUrl: string; xmlUrl: string; rawResponse: any }> {
  if (!config.provider) {
    throw new Error('Provedor fiscal nao configurado para esta funeraria.');
  }
  if (!config.apiKey) {
    throw new Error('API key do provedor fiscal nao configurada.');
  }
  if (!config.companyDocument || !config.companyName) {
    throw new Error('CNPJ e razao social da funeraria nao configurados.');
  }
  if (config.environment === 'production' && !config.companyIbgeCode) {
    throw new Error('Codigo IBGE do municipio e obrigatorio para producao.');
  }

  const sanitizedDescription = sanitizeString(input.service.description, 500);
  if (!sanitizedDescription) {
    throw new Error('Descricao do servico e obrigatoria.');
  }

  // PLACEHOLDER: integra com provedor real aqui.
  // Exemplo de retorno esperado (a ser substituido):
  // {
  //   nfseNumber: '12345',
  //   verificationCode: 'ABC123',
  //   pdfUrl: 'https://...',
  //   xmlUrl: 'https://...',
  //   rawResponse: { ...resposta do provedor... }
  // }
  throw new Error(
    `Emissao automatica de NFS-e ainda nao esta habilitada. ` +
    `Provedor configurado: ${config.provider}. ` +
    `Para ativar, implemente a chamada em src/lib/fiscal/${config.provider}.ts.`
  );
}

/**
 * Stub de cancelamento de NFS-e.
 */
export async function cancelNfse(
  config: FiscalConfig,
  nfseId: string,
  reason: string
): Promise<void> {
  if (!config.provider) {
    throw new Error('Provedor fiscal nao configurado.');
  }
  if (!reason || reason.trim().length < 15) {
    throw new Error('Justificativa do cancelamento deve ter no minimo 15 caracteres.');
  }
  throw new Error('Cancelamento ainda nao implementado. Escolha um provedor e implemente a chamada.');
}

/**
 * Stub de teste de conexao com o provedor.
 */
export async function testFiscalConnection(config: FiscalConfig): Promise<{ ok: boolean; message: string }> {
  if (!config.provider) return { ok: false, message: 'Provedor nao configurado.' };
  if (!config.apiKey) return { ok: false, message: 'API key nao configurada.' };
  return { ok: true, message: `Estrutura OK para provedor ${config.provider}. Faltam as chamadas HTTP reais.` };
}

