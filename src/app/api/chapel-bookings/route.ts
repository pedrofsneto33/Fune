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
