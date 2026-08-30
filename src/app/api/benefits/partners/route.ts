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
      .from('benefits_partners')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner_name, category, discount_percentage, contact_info } = body;
    const tenantId = await getTenantId();

    const { data, error } = await supabaseAdmin
      .from('benefits_partners')
      .insert([{
        tenant_id: tenantId,
        partner_name: partner_name?.trim() || 'Novo Parceiro',
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
}
