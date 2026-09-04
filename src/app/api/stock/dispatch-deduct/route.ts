import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { itemId, quantity = 1 } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId é obrigatório.' }, { status: 400 });
    }

    const { data: item, error: findError } = await supabaseAdmin
      .from('inventory')
      .select('id, stock_quantity')
      .eq('id', itemId)
      .eq('tenant_id', auth.tenantId)
      .single();

    if (findError || !item) {
      return NextResponse.json({ error: 'Item de estoque não encontrado.' }, { status: 404 });
    }

    const newQty = Math.max(0, (item.stock_quantity || 0) - quantity);

    const { data, error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({ stock_quantity: newQty })
      .eq('id', itemId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager']);
