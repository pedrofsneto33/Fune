import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID, sanitizeString } from '@/lib/validation';

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

    if (burial_id) {

      // SECURITY: o sepultamento referenciado deve pertencer a este tenant

      const { data: ownedBurial } = await supabaseAdmin

        .from('chapel_burials')

        .select('id')

        .eq('id', burial_id)

        .eq('tenant_id', auth.tenantId)

        .maybeSingle();

      if (!ownedBurial) {

        return NextResponse.json({ error: 'Sepultamento não encontrado para esta unidade.' }, { status: 404 });

      }

    }

    const { data, error } = await supabaseAdmin
      .from('thanatopraxy_records')
      .insert([{
        tenant_id: auth.tenantId,
        burial_id: burial_id || null,
        deceased_name: sanitizeString(deceased_name || 'Não informado', 255),
        technician: sanitizeString(technician || 'Dr. Roberto Tanatólogo', 100),
        procedure: sanitizeString(procedure || 'Aspiração e Formolização', 150),
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
