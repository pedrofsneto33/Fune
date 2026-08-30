import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getTenantId(): Promise<string> {
  const { data: t } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
  return t?.id || '00000000-0000-0000-0000-000000000000';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const { data, error } = await supabaseAdmin
      .from('thanatopraxy_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('completed_at', { ascending: false });

    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deceased_name, technician, procedure, burial_id } = body;
    const tenantId = await getTenantId();

    const { data, error } = await supabaseAdmin
      .from('thanatopraxy_records')
      .insert([{
        tenant_id: tenantId,
        burial_id: burial_id || null,
        deceased_name: deceased_name?.trim() || 'Não informado',
        technician: technician?.trim() || 'Dr. Roberto Tanatólogo',
        procedure: procedure?.trim() || 'Aspiração e Formolização',
        status: 'Concluído',
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
