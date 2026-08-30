import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req, { auth }) => {
  if (auth.role === 'superadmin') {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, cnpj, created_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, name, cnpj, created_at')
    .eq('id', auth.tenantId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { name, cnpj, asaas_api_key, asaas_webhook_token } = body;

  if (!name || !cnpj) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, cnpj' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .insert([{ name, cnpj, asaas_api_key, asaas_webhook_token }])
    .select('id, name, cnpj, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}, ['superadmin']);

export const PATCH = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { tenant_id, name, asaas_api_key, asaas_webhook_token } = body;

  const targetTenantId = auth.role === 'superadmin' ? (tenant_id || auth.tenantId) : auth.tenantId;

  if (!targetTenantId) {
    return NextResponse.json({ error: 'Tenant ID não fornecido' }, { status: 400 });
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (name) updateData.name = name;
  if (asaas_api_key) updateData.asaas_api_key = asaas_api_key;
  if (asaas_webhook_token) updateData.asaas_webhook_token = asaas_webhook_token;

  const { error } = await supabaseAdmin
    .from('tenants')
    .update(updateData)
    .eq('id', targetTenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Configurações do tenant atualizadas.' });
}, ['superadmin', 'admin']);
