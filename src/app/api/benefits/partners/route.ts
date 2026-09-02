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

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, partner_name, category, discount_percentage, contact_info, active } = body;

    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

    const updateData: Record<string, any> = {};
    if (partner_name !== undefined) updateData.partner_name = partner_name;
    if (category !== undefined) updateData.category = category;
    if (discount_percentage !== undefined) updateData.discount_percentage = Number(discount_percentage);
    if (contact_info !== undefined) updateData.contact_info = contact_info;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabaseAdmin
      .from('benefits_partners')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId) // nunca deixar editar de outro tenant
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('benefits_partners')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager']);
