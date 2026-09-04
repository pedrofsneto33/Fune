import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID } from '@/lib/validation';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { searchParams } = new URL(req.url);
  const burialId = searchParams.get('burial_id');

  const query = supabaseAdmin
    .from('thanatopraxy_records')
    .select('*')
    .eq('tenant_id', auth.tenantId);

  if (burialId) {
    if (!isValidUUID(burialId)) {
      return NextResponse.json({ error: 'ID de sepultamento inválido.' }, { status: 400 });
    }
    query.eq('burial_id', burialId);
  }

  const { data, error } = await query.order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'manager']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { deceased_name, technician, procedure, burial_id } = body;

    if (burial_id && !isValidUUID(burial_id)) {
      return NextResponse.json({ error: 'ID de sepultamento inválido.' }, { status: 400 });
    }

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
