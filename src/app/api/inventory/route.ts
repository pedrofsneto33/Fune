import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getTenantId(): Promise<string> {
  const { data: t } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
  return t?.id || '00000000-0000-0000-0000-000000000000';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('item_name', { ascending: true });

    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_name, category, stock_quantity, min_threshold } = body;
    const tenantId = await getTenantId();

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert([{
        tenant_id: tenantId,
        item_name: item_name?.trim() || 'Nova Urna',
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
}
