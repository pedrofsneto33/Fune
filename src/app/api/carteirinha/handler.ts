import { supabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';

interface Holder {
  id: string;
  full_name: string;
  cpf: string;
  tenant_id: string;
  plans: { name: string }[] | null;
  dependents: { full_name: string; relation: string }[] | null;
}

interface Tenant {
  trade_name: string | null;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  phone_emergency: string | null;
}

interface CarteirinhaResponse {
  id: string;
  full_name: string;
  cpf: string;
  tenant_name: string;
  logo_url: string | null;
  primary_color: string | null;
  emergency_phone: string | null;
  plan_name: string;
  dependents: number;
  qr_data_url: string | null;
  share_url: string;
}

export async function handleGet(cpf: string): Promise<CarteirinhaResponse> {
  const { data: holderData, error: holderError } = await supabaseAdmin
    .from('holders')
    .select('id, full_name, cpf, tenant_id, plans ( name ), dependents ( full_name, relation )')
    .eq('cpf', cpf)
    .limit(1)
    .maybeSingle();

  if (holderError || !holderData) {
    throw new Error('Holder not found');
  }

  const holder = holderData as Holder;

  const { data: tenantData } = await supabaseAdmin
    .from('tenants')
    .select('trade_name, name, logo_url, primary_color, phone_emergency')
    .eq('id', holder.tenant_id)
    .maybeSingle();

  if (!tenantData) {
    throw new Error('Tenant not found');
  }

  const tenant = tenantData as Tenant;

  const shareUrl = `/carteirinha/${cpf}`;
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 192,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    qrDataUrl = null;
  }

  return {
    id: holder.id,
    full_name: holder.full_name,
    cpf: holder.cpf,
    tenant_name: tenant.name,
    logo_url: tenant.logo_url,
    primary_color: tenant.primary_color,
    emergency_phone: tenant.phone_emergency,
    plan_name: holder.plans?.[0]?.name ?? 'Essencial',
    dependents: holder.dependents?.length ?? 0,
    qr_data_url: qrDataUrl,
    share_url: shareUrl,
  };
}