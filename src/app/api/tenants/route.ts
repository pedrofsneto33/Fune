import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const PUBLIC_COLUMNS = 'id, name, trade_name, cnpj, phone_emergency, primary_color, logo_url, municipal_license_number, issuance_city, technical_manager, pix_key, status, asaas_environment, asaas_wallet_id, created_at';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const columns = `${PUBLIC_COLUMNS}, asaas_api_key, asaas_webhook_token`;

  const scrub = (t: any) => ({
    ...t,
    has_asaas_api_key: !!t.asaas_api_key,
    has_asaas_webhook_token: !!t.asaas_webhook_token,
    asaas_api_key: undefined,
    asaas_webhook_token: undefined,
  });

  if (auth.role === 'superadmin') {
    const { data, error } = await supabaseAdmin.from('tenants').select(columns);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, tenants: (data || []).map(scrub) });
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select(columns)
    .eq('id', auth.tenantId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, tenants: [scrub(data)] });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const {
    name, trade_name, cnpj, phone_emergency,
    municipal_license_number, issuance_city, technical_manager,
    primary_color, logo_url
  } = body;

  if (!name || !cnpj) {
    return NextResponse.json({ error: 'Campos obrigatorios: name, cnpj' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .insert([{
      name,
      trade_name: trade_name || name,
      cnpj,
      phone_emergency,
      municipal_license_number,
      issuance_city,
      technical_manager,
      primary_color,
      logo_url,
      status: 'active'
    }])
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ...data }, { status: 201 });
}, ['superadmin']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json();
  const {
    tenant_id, name, trade_name, cnpj, phone_emergency,
    primary_color, logo_url, municipal_license_number,
    issuance_city, technical_manager, asaas_environment,
    asaas_api_key, asaas_webhook_token, asaas_wallet_id, pix_key
  } = body;

  const destinationTenantId = auth.role === 'superadmin' ? (tenant_id || auth.tenantId) : auth.tenantId;

  if (!destinationTenantId) {
    return NextResponse.json({ error: 'Tenant ID nao fornecido' }, { status: 400 });
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (trade_name !== undefined) updateData.trade_name = trade_name;
  if (cnpj !== undefined) updateData.cnpj = cnpj;
  if (phone_emergency !== undefined) updateData.phone_emergency = phone_emergency;
  if (primary_color !== undefined) updateData.primary_color = primary_color;
  if (logo_url !== undefined) updateData.logo_url = logo_url;
  if (municipal_license_number !== undefined) updateData.municipal_license_number = municipal_license_number;
  if (issuance_city !== undefined) updateData.issuance_city = issuance_city;
  if (technical_manager !== undefined) updateData.technical_manager = technical_manager;
  if (asaas_environment !== undefined) updateData.asaas_environment = asaas_environment;
  if (asaas_wallet_id !== undefined) updateData.asaas_wallet_id = asaas_wallet_id;
  if (pix_key !== undefined) updateData.pix_key = pix_key;
  if (asaas_api_key) updateData.asaas_api_key = asaas_api_key;
  if (asaas_webhook_token) updateData.asaas_webhook_token = asaas_webhook_token;

  const { error } = await supabaseAdmin
    .from('tenants')
    .update(updateData)
    .eq('id', destinationTenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Configuracoes do tenant atualizadas.' });
}, ['superadmin', 'admin']);
