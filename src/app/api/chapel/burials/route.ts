import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getTenantId(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      const { data: roleRecord } = await supabaseAdmin.from('user_roles').select('tenant_id').eq('user_id', user.id).maybeSingle();
      if (roleRecord?.tenant_id) return roleRecord.tenant_id;
    }
  }
  const { data: t } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
  if (t?.id) return t.id;
  const { data: newT } = await supabaseAdmin.from('tenants').insert([{ name: 'Funerária Matriz', cnpj: '00.000.000/0001-00' }]).select('id').single();
  return newT?.id || '00000000-0000-0000-0000-000000000000';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { data, error } = await supabaseAdmin
      .from('chapel_burials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('burial_date', { ascending: false });

    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deceased_name, burial_date, cemetery_location, contract_id } = body;

    if (!deceased_name || deceased_name.trim() === '') {
      return NextResponse.json({ error: 'Nome do falecido é obrigatório.' }, { status: 400 });
    }

    const tenantId = await getTenantId(req);

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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
