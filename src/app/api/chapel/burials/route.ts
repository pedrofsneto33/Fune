import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('chapel_burials')
    .select('*, contracts(holders(full_name, cpf))')
    .eq('tenant_id', auth.tenantId)
    .order('burial_date', { ascending: false });

  if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { deceased_name, burial_date, cemetery_location, contract_id } = body;

    if (!deceased_name || deceased_name.trim() === '') {
      return NextResponse.json({ error: 'Nome do falecido é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chapel_burials')
      .insert([{
        tenant_id: auth.tenantId,
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
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver']);
