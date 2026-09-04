import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const PUBLIC_COLUMNS = 'id, name, trade_name, cnpj, phone_emergency, primary_color, logo_url, municipal_license_number, issuance_city, technical_manager, pix_key, status, commercial_plan, asaas_environment, asaas_wallet_id, created_at';

const VALID_PLAN_CODES = ['essencial', 'profissional', 'enterprise'];

// Uso atual do tenant x limites do plano comercial (para exibição no painel)
async function getTenantUsage(tenantId: string) {
  const [holdersRes, usersRes] = await Promise.all([
    supabaseAdmin.from('holders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabaseAdmin.from('user_roles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);
  return {
    holders: holdersRes.count || 0,
    users: usersRes.count || 0,
  };
}

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
    const enriched = await Promise.all(
      (data || []).map(async (t) => ({
        ...scrub(t),
        usage: await getTenantUsage(t.id),
      }))
    );
    return NextResponse.json({ success: true, can_manage_plan: true, tenants: enriched });
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select(columns)
    .eq('id', auth.tenantId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const enriched = { ...scrub(data), usage: await getTenantUsage(data.id) };
  return NextResponse.json({ success: true, can_manage_plan: false, tenants: [enriched] });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const {
    name, trade_name, cnpj, phone_emergency,
    municipal_license_number, issuance_city, technical_manager,
    primary_color, logo_url, commercial_plan
  } = body;

  if (!name || !cnpj) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, cnpj' }, { status: 400 });
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
      // Plano comercial definido no onboarding (rota exclusiva de superadmin)
      commercial_plan: VALID_PLAN_CODES.includes(commercial_plan) ? commercial_plan : 'essencial',
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
    asaas_api_key, asaas_webhook_token, asaas_wallet_id, pix_key,
    commercial_plan
  } = body;

  const destinationTenantId = auth.role === 'superadmin' ? (tenant_id || auth.tenantId) : auth.tenantId;

  if (!destinationTenantId) {
    return NextResponse.json({ error: 'Tenant ID não fornecido' }, { status: 400 });
  }

  // SECURITY: 'updated_at' removido - a coluna não existe na tabela tenants
  // (causava erro 500 em TODO save de configurações)
  const updateData: Record<string, any> = {};


  // Plano comercial: SOMENTE superadmin pode alterar (impacta cobrança)
  if (commercial_plan !== undefined) {
    if (auth.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Somente um Super Administrador pode alterar o plano comercial.' },
        { status: 403 }
      );
    }
    if (!VALID_PLAN_CODES.includes(commercial_plan)) {
      return NextResponse.json(
        { error: 'Plano comercial inválido. Use: ' + VALID_PLAN_CODES.join(', ') },
        { status: 400 }
      );
    }
    updateData.commercial_plan = commercial_plan;
  }

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
  return NextResponse.json({ success: true, message: 'Configurações do tenant atualizadas.' });
}, ['superadmin', 'admin']);