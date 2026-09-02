import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('collector_routes')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json();
  const { collector_name, zone, status = 'ativo', total_receipts = 0 } = body;

  if (!collector_name || !zone) {
    return NextResponse.json({ error: 'collector_name e zone são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('collector_routes')
    .insert([{
      tenant_id: auth.tenantId,
      collector_name,
      zone,
      status,
      total_receipts: parseInt(total_receipts) || 0,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}, ['superadmin', 'admin', 'financial']);
