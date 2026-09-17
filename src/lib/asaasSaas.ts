/**
 * Cliente Asaas DEDICADO ao billing SaaS do EternityOS (a PRIMEX
 * cobra o tenant). NAO confundir com src/lib/asaasClient.ts, que e
 * do dominio funerario (o tenant cobra o associado).
 *
 * Por enquanto reusa a mesma conta global do Asaas
 * (ASAAS_API_KEY / ASAAS_ENVIRONMENT). O customer do SaaS e
 * prefixado com 'SAAS::' pra o webhook distinguir.
 * Se um dia separar a conta, so trocar getSaasConfig().
 */

import { getAsaasConfigForTenant } from './asaasClient';

export interface SaasConfig {
  apiKey: string;
  baseUrl: string;
}

export async function getSaasConfig(): Promise<SaasConfig> {
  // Reusa a config global (tenantId undefined -> fallback global)
  const c = await getAsaasConfigForTenant();
  return { apiKey: c.apiKey, baseUrl: c.baseUrl };
}

export const SAAS_CUSTOMER_PREFIX = 'SAAS::';
export const SAAS_REF_PREFIX = 'SAAS:';
const SAAS_TIMEOUT_MS = 15000;

function withTimeout<T>(ms: number, p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao chamar o Asaas (SaaS)')), ms),
    ),
  ]);
}

export interface SaasCustomerInput {
  tenantId: string;
  tenantName: string;
  tenantCnpj: string;
  ownerEmail: string;
}

/**
 * Cria (ou recupera) um customer Asaas dedicado ao SaaS.
 * Nome prefixado com 'SAAS::' pra o webhook identificar a origem.
 */
export async function ensureSaasCustomer(input: SaasCustomerInput): Promise<
  { ok: true; customerId: string } | { ok: false; error: string }
> {
  const { apiKey, baseUrl } = await getSaasConfig();
  const name = `${SAAS_CUSTOMER_PREFIX}${input.tenantName}`;
  const cnpj = input.tenantCnpj.replace(/\D/g, '');

  // 1) busca por CNPJ na lista de customers
  const search = await withTimeout(SAAS_TIMEOUT_MS, fetch(
    `${baseUrl}/customers?cpfCnpj=${cnpj}`,
    { headers: { access_token: apiKey } },
  ));
  const searchData = await search.json();
  const existing = (searchData?.data || []).find(
    (c: { name?: string }) => c.name?.startsWith(SAAS_CUSTOMER_PREFIX),
  );
  if (existing?.id) return { ok: true, customerId: existing.id };

  // 2) cria novo
  const create = await withTimeout(SAAS_TIMEOUT_MS, fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: apiKey },
    body: JSON.stringify({
      name,
      cpfCnpj: cnpj,
      email: input.ownerEmail,
      externalReference: `SAAS:${input.tenantId}`,
    }),
  }));
  const createData = await create.json();
  if (createData?.errors) {
    return { ok: false, error: createData.errors?.[0]?.description || 'Falha ao criar customer SaaS' };
  }
  return { ok: true, customerId: createData.id };
}

export interface SaasSubscriptionInput {
  tenantId: string;
  customerId: string;
  valor: number;
  nextDueDate: string; // YYYY-MM-DD
}

/**
 * Cria assinatura mensal no Asaas.
 * externalReference = 'SAAS:<tenantId>' — o webhook usa pra achar o tenant.
 */
export async function createSaasSubscription(input: SaasSubscriptionInput): Promise<
  { ok: true; subscriptionId: string } | { ok: false; error: string }
> {
  const { apiKey, baseUrl } = await getSaasConfig();
  const res = await withTimeout(SAAS_TIMEOUT_MS, fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: apiKey },
    body: JSON.stringify({
      customer: input.customerId,
      billingType: 'UNDEFINED', // PIX + boleto + cartao (o cliente escolhe)
      value: input.valor,
      nextDueDate: input.nextDueDate,
      cycle: 'MONTHLY',
      description: 'EternityOS - assinatura mensal',
      externalReference: `SAAS:${input.tenantId}`,
    }),
  }));
  const data = await res.json();
  if (data?.errors) {
    return { ok: false, error: data.errors?.[0]?.description || 'Falha ao criar assinatura' };
  }
  return { ok: true, subscriptionId: data.id };
}

export async function cancelSaasSubscription(subscriptionId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const { apiKey, baseUrl } = await getSaasConfig();
  const res = await withTimeout(SAAS_TIMEOUT_MS, fetch(
    `${baseUrl}/subscriptions/${subscriptionId}`,
    { method: 'DELETE', headers: { access_token: apiKey } },
  ));
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data?.errors?.[0]?.description || `HTTP ${res.status}` };
  }
  return { ok: true };
}