import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stockItemId, quantity, reason, dispatchId } = body;

    if (!stockItemId || !quantity) {
      return NextResponse.json({ error: 'stockItemId e quantity são obrigatórios.' }, { status: 400 });
    }

    // 1. Obter quantidade atual
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from('stock_items')
      .select('id, quantity, name')
      .eq('id', stockItemId)
      .single();

    if (fetchErr || !item) {
      return NextResponse.json({ error: 'Item de estoque não localizado.' }, { status: 404 });
    }

    if (item.quantity < quantity) {
      return NextResponse.json({ error: 'Estoque insuficiente para baixa.' }, { status: 400 });
    }

    // 2. Atualizar saldo
    const newQty = item.quantity - quantity;
    await supabaseAdmin
      .from('stock_items')
      .update({ quantity: newQty })
      .eq('id', stockItemId);

    // 3. Registrar movimentação
    await supabaseAdmin
      .from('stock_movements')
      .insert([{
        stock_item_id: stockItemId,
        type: 'baixa_plantao',
        quantity: quantity,
        reason: reason || `Baixa de chamado de emergência ${dispatchId || ''}`,
        created_at: new Date().toISOString()
      }]);

    return NextResponse.json({ success: true, remainingQuantity: newQty });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}