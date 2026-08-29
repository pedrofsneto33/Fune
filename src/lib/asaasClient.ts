import { supabaseAdmin } from './supabaseAdmin';

interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
  walletId?: string;
}

export async function getAsaasConfigForTenant(tenantId?: string): Promise<AsaasConfig> {
  const fallbackKey = process.env.ASAAS_API_KEY || '';
  const fallbackEnv = process.env.ASAAS_ENVIRONMENT || 'production';
  const defaultBaseUrl = fallbackEnv === 'sandbox' 
    ? 'https://sandbox.asaas.com/api/v3' 
    : 'https://api.asaas.com/v3';

  if (!tenantId) {
    return {
      apiKey: fallbackKey,
      baseUrl: defaultBaseUrl,
    };
  }

  try {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('asaas_api_key, asaas_wallet_id, asaas_environment')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return {
        apiKey: fallbackKey,
        baseUrl: defaultBaseUrl,
      };
    }

    const apiKey = tenant.asaas_api_key || fallbackKey;
    const env = tenant.asaas_environment || fallbackEnv;
    const baseUrl = env === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3' 
      : 'https://api.asaas.com/v3';

    return {
      apiKey,
      baseUrl,
      walletId: tenant.asaas_wallet_id || undefined,
    };
  } catch (err) {
    console.error('Erro ao recuperar credenciais Asaas do tenant:', err);
    return {
      apiKey: fallbackKey,
      baseUrl: defaultBaseUrl,
    };
  }
}