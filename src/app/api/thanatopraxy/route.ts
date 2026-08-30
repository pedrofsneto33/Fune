import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('thanatopraxy_records')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'manager']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { deceased_name, technician, procedure, burial_id } = body;

    const { data, error } = await supabaseAdmin
      .from('thanatopraxy_records')
      .insert([{
        tenant_id: auth.tenantId,
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
}, ['superadmin', 'admin', 'manager']);
