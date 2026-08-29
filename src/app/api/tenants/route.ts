import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, trade_name, cnpj, phone_emergency, municipal_license_number, issuance_city, technical_manager, asaas_environment, asaas_api_key, asaas_webhook_token, status, created_at')
      .order('trade_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, tenants: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      trade_name, 
      cnpj, 
      phone_emergency, 
      municipal_license_number, 
      issuance_city, 
      technical_manager,
      asaas_environment,
      asaas_api_key,
      asaas_webhook_token
    } = body;

    if (!name || !trade_name || !cnpj) {
      return NextResponse.json({ error: 'Razão Social, Nome Fantasia e CNPJ são obrigatórios.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .insert([{
        name,
        trade_name,
        cnpj,
        phone_emergency: phone_emergency || '(86) 99999-9999',
        municipal_license_number: municipal_license_number || '',
        issuance_city: issuance_city || '',
        technical_manager: technical_manager || '',
        asaas_environment: asaas_environment || 'sandbox',
        asaas_api_key: asaas_api_key || null,
        asaas_webhook_token: asaas_webhook_token || null,
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, tenant: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do Tenant é obrigatório para atualização.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, tenant: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}