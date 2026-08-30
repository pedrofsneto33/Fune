import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('benefits_partners')
    .select('*')
    .eq('tenant_id', auth.tenantId);

  if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { partner_name, category, discount_percentage, contact_info } = body;

    if (!partner_name || partner_name.trim() === '') {
      return NextResponse.json({ error: 'Nome do parceiro é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('benefits_partners')
      .insert([{
        tenant_id: auth.tenantId,
        partner_name: partner_name.trim(),
        category: category || 'Comércio Geral',
        discount_percentage: Number(discount_percentage || 10),
        contact_info: contact_info ? contact_info.trim() : null,
        active: true,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager']);
