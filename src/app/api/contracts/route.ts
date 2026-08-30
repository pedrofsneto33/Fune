import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('contracts')
    .select('*, holders(*), plans(*)')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json();
  const { holder_id, plan_id, status = 'active', start_date } = body;

  if (!holder_id || !plan_id) {
    return NextResponse.json({ error: 'holder_id e plan_id são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .insert([{
      tenant_id: auth.tenantId,
      holder_id,
      plan_id,
      status,
      start_date: start_date || new Date().toISOString().split('T')[0],
    }])
    .select('*, holders(*), plans(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}, ['superadmin', 'admin', 'manager', 'attendant']);
