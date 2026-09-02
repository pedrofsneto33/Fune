import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('chapel_bookings')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('start_time', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json();
  const { chapel_name, deceased_name, family_contact, start_time, end_time, status = 'reservado' } = body;

  if (!chapel_name || !deceased_name || !start_time || !end_time) {
    return NextResponse.json({ error: 'chapel_name, deceased_name, start_time e end_time são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('chapel_bookings')
    .insert([{
      tenant_id: auth.tenantId,
      chapel_name,
      deceased_name,
      family_contact,
      start_time,
      end_time,
      status,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, chapel_name, deceased_name, family_contact, start_time, end_time, status } = body;

    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

    const VALID_STATUSES = ['reservado', 'em_velorio', 'concluido'] as const;
    const updateData: Record<string, any> = {};
    if (chapel_name !== undefined) updateData.chapel_name = chapel_name;
    if (deceased_name !== undefined) updateData.deceased_name = deceased_name;
        if (family_contact !== undefined) updateData.family_contact = family_contact;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
      updateData.status = status;
    }

    const { data, error } = await supabaseAdmin
      .from('chapel_bookings')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId) // nunca deixar editar de outro tenant
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('chapel_bookings')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);
