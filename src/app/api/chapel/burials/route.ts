import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function resolveTenantId(req: NextRequest): Promise<string> {
  const { data: defaultTenant } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
  return defaultTenant?.id || '00000000-0000-0000-0000-000000000000';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId(req);
    const { data, error } = await supabaseAdmin.from('chapel_burials').select('*').eq('tenant_id', tenantId).order('burial_date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deceased_name, burial_date, cemetery_location, contract_id } = body;
    if (!deceased_name) return NextResponse.json({ error: 'Nome do falecido é obrigatório.' }, { status: 400 });
    const tenantId = await resolveTenantId(req);

    const { data, error } = await supabaseAdmin
      .from('chapel_burials')
      .insert([{
        tenant_id: tenantId,
        contract_id: contract_id || null,
        deceased_name: deceased_name.trim(),
        burial_date: burial_date || new Date().toISOString(),
        cemetery_location: cemetery_location ? cemetery_location.trim() : 'Cemitério Municipal',
        status: 'Agendado',
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
