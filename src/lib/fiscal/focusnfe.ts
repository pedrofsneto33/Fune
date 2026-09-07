/**
 * ============================================================
 * Integracao FocusNFe - NFS-e
 * ============================================================
 * Documentacao oficial: https://focusnfe.com.br/doc/
 * Sandbox gratis: https://focusnfe.com.br/
 *
 * Endpoints FocusNFe:
 *   POST   https://api.focusnfe.com.br/v2/nfse               - emitir
 *   GET    https://api.focusnfe.com.br/v2/nfse/{ref}         - consultar
 *   DELETE https://api.focusnfe.com.br/v2/nfse/{ref}         - cancelar
 *   GET    https://api.focusnfe.com.br/v2/nfse/{ref}/pdf     - download PDF
 *   GET    https://api.focusnfe.com.br/v2/nfse/{ref}/xml     - download XML
 *
 * Autenticacao: Basic Auth estrito: Authorization: Basic base64(token + colon). Token como username, senha vazia. No painel FocusNFe - API - gerar Token de Acesso.
 *
 * Cada funeraria cadastra a conta dela direto no FocusNFe,
 * pega o token e cola em "Configuracao Fiscal" no TenantSettingsTab.
 * Sandbox usa o mesmo endpoint, com token separado de sandbox.
 */

import { FiscalConfig, FiscalEmitInput } from './index';

const FOCUSNFE_BASE = 'https://api.focusnfe.com.br/v2';

function basicAuth(token: string): string {
  return 'Basic ' + Buffer.from(token + ':').toString('base64')
}

function detectEnvironment(environment: string): string {
  if (environment === 'sandbox') {
    return FOCUSNFE_BASE.replace('api.focusnfe.com.br', 'homologacao.focusnfe.com.br');
  }
  return FOCUSNFE_BASE;
}

export interface FocusNFePayload {
  data_emissao?: string;
  natureza_operacao?: string;
  regime_especial_tributacao?: string;
  optante_simples_nacional?: boolean;
  prestador: {
    cnpj: string;
    inscricao_municipal?: string;
    codigo_municipio: string;
  };
  tomador: {
    cnpj?: string;
    cpf?: string;
    razao_social: string;
    email?: string;
    telefone?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cep: string;
      municipio: string;
      uf: string;
    };
  };
  servico: {
    aliquota: number;
    iss_retido?: boolean;
    valor_iss?: number;
    codigo_municipio: string;
    item_lista_servico: string;
    cnae?: string;
    codigo_tributario_municipio?: string;
    discriminacao: string;
    valor_servicos: number;
    valor_deducoes?: number;
    valor_pis?: number;
  };
  cst?: string;
  ibscbs?: {
    cst: string;
    c_class_trib?: string;
    ind_nat_op?: string;
    v_bc_ibs_cbs: number;
    p_ibs_cbs: number;
  };
}

export interface FocusNFeResponse {
  ref: string;
  status: 'processando' | 'autorizado' | 'erro' | 'cancelado' | 'denegado';
  numero?: string;
  codigo_verificacao?: string;
  data_emissao?: string;
  url_pdf?: string;
  url_xml?: string;
  mensagem_erro?: string;
  erros?: Array<{ codigo: string; mensagem: string; correcao?: string }>;
}

/**
 * Emite NFS-e via FocusNFe.
 */
export async function focusnfeEmit(
  config: FiscalConfig,
  input: FiscalEmitInput,
  ref: string
): Promise<FocusNFeResponse> {
  if (!config.apiKey) throw new Error('API key do FocusNFe nao configurada.');
  if (!config.companyDocument) throw new Error('CNPJ do prestador nao configurado.');
  if (!config.companyIbgeCode) throw new Error('Codigo IBGE do municipio nao configurado.');

  const baseUrl = detectEnvironment(config.environment);
  const cnpj = config.companyDocument.replace(/\D/g, '');
  if (cnpj.length !== 14) throw new Error('CNPJ do prestador invalido (deve ter 14 digitos).');

  const issAmount = (input.service.amount * (config.defaultIssRate || 5)) / 100;

  const payload: FocusNFePayload = {
    regime_especial_tributacao: '1',
    optante_simples_nacional: false,
    prestador: {
      cnpj,
      codigo_municipio: config.companyIbgeCode,
    },
    tomador: {
      razao_social: input.taker.name,
      email: input.taker.email,
      telefone: input.taker.phone?.replace(/\D/g, ''),
      ...(input.taker.documentType === 'cnpj'
        ? { cnpj: input.taker.document.replace(/\D/g, '') }
        : { cpf: input.taker.document.replace(/\D/g, '') }),
      ...(input.taker.address && {
        endereco: {
          logradouro: input.taker.address,
          numero: input.taker.number || 'SN',
          complemento: input.taker.complement,
          bairro: input.taker.neighborhood || 'Centro',
          cep: (input.taker.zipCode || '').replace(/\D/g, ''),
          municipio: (input.taker.city || '').substring(0, 7),
          uf: input.taker.state || '',
        },
      }),
    },
    servico: {
      aliquota: config.defaultIssRate || 5,
      valor_iss: issAmount,
      codigo_municipio: config.companyIbgeCode,
      item_lista_servico: input.service.code || config.defaultServiceCode || '11.05',
      cnae: config.cnae || undefined,
      discriminacao: input.service.description,
      valor_servicos: input.service.amount,
      valor_deducoes: input.service.deductionAmount || 0,
    },
  };

  const res = await fetch(baseUrl + '/nfse', {
    method: 'POST',
    headers: {
      'Authorization': basicAuth(config.apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: FocusNFeResponse;
  try { json = JSON.parse(text); } catch {
    throw new Error('Resposta invalida do FocusNFe: ' + text.substring(0, 200));
  }

  if (!res.ok) {
    const errMsg = json.mensagem_erro ||
      (json.erros && json.erros.map((e: any) => e.mensagem).join('; ')) ||
      'Erro HTTP ' + res.status;
    throw new Error('FocusNFe: ' + errMsg);
  }

  return json;
}

/**
 * Consulta uma NFS-e ja emitida.
 */
export async function focusnfeGet(
  config: FiscalConfig,
  ref: string
): Promise<FocusNFeResponse> {
  if (!config.apiKey) throw new Error('API key do FocusNFe nao configurada.');
  const baseUrl = detectEnvironment(config.environment);
  const res = await fetch(baseUrl + '/nfse/' + encodeURIComponent(ref), {
    method: 'GET',
    headers: { 'Authorization': basicAuth(config.apiKey) },
  });
  const text = await res.text();
  const json: FocusNFeResponse = JSON.parse(text);
  if (!res.ok) {
    throw new Error('FocusNFe consulta: ' + (json.mensagem_erro || res.status));
  }
  return json;
}

/**
 * Cancela uma NFS-e ja emitida.
 * reason deve ter pelo menos 15 caracteres (exigencia FocusNFe).
 */
export async function focusnfeCancel(
  config: FiscalConfig,
  ref: string,
  reason: string
): Promise<FocusNFeResponse> {
  if (!config.apiKey) throw new Error('API key do FocusNFe nao configurada.');
  if (!reason || reason.trim().length < 15) {
    throw new Error('Justificativa do cancelamento deve ter no minimo 15 caracteres.');
  }
  const baseUrl = detectEnvironment(config.environment);
  const res = await fetch(baseUrl + '/nfse/' + encodeURIComponent(ref), {
    method: 'DELETE',
    headers: {
      'Authorization': basicAuth(config.apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ justificativa: reason }),
  });
  const text = await res.text();
  const json: FocusNFeResponse = JSON.parse(text);
  if (!res.ok) {
    throw new Error('FocusNFe cancelamento: ' + (json.mensagem_erro || res.status));
  }
  return json;
}

/**
 * Testa a conexao com FocusNFe (envia NFS-e de teste e verifica retorno).
 */
export async function focusnfeTest(
  config: FiscalConfig
): Promise<{ ok: boolean; message: string }> {
  if (!config.apiKey) return { ok: false, message: 'API key nao configurada.' };
  if (!config.companyDocument) return { ok: false, message: 'CNPJ do prestador nao configurado.' };
  const cnpj = config.companyDocument.replace(/\D/g, '');
  if (cnpj.length !== 14) return { ok: false, message: 'CNPJ invalido (deve ter 14 digitos).' };

  const baseUrl = detectEnvironment(config.environment);
  const payload: FocusNFePayload = {
    regime_especial_tributacao: '1',
    prestador: {
      cnpj,
      codigo_municipio: config.companyIbgeCode || '3550308',
    },
    tomador: {
      cnpj: '99999999000191',
      razao_social: 'EMPRESA DE TESTE FOCUSNFE',
    },
    servico: {
      aliquota: config.defaultIssRate || 5,
      codigo_municipio: config.companyIbgeCode || '3550308',
      item_lista_servico: config.defaultServiceCode || '11.05',
      discriminacao: 'TESTE DE CONEXAO FOCUSNFE - EternityOS',
      valor_servicos: 0.01,
    },
  };

  try {
    const res = await fetch(baseUrl + '/nfse', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth(config.apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json: any = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, message: 'Conexao OK. Ambiente: ' + config.environment + '. NFS-e de teste processada.' };
    }
    if (res.status === 422 || res.status === 400) {
      return {
        ok: true,
        message: 'Conexao OK (autenticacao aceita). Erro de validacao esperado com dados de teste. Ajuste CNPJ/IBGE para emissao real.',
      };
    }
    return { ok: false, message: 'Falha HTTP ' + res.status + ': ' + (json.mensagem_erro || '') };
  } catch (e: any) {
    return { ok: false, message: 'Erro de rede: ' + e.message };
  }
}
