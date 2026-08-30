import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('item_name', { ascending: true });

  if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { item_name, category, stock_quantity, min_threshold } = body;

    if (!item_name || item_name.trim() === '') {
      return NextResponse.json({ error: 'Nome do item é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert([{
        tenant_id: auth.tenantId,
        item_name: item_name.trim(),
        category: category || 'Urna Adulto',
        stock_quantity: Number(stock_quantity || 0),
        min_threshold: Number(min_threshold || 2),
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager']);
