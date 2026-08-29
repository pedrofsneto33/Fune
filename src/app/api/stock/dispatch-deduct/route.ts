import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dispatchId, coffinId, deceasedName } = body;

    if (!dispatchId) {
      return NextResponse.json({ success: false, error: 'dispatchId obrigatório' }, { status: 400 });
    }

    const deductions: any[] = [];

    // Se houver urna selecionada, decrementa a quantidade em estoque
    if (coffinId) {
      const { data: item, error: fetchErr } = await supabase
        .from('inventory_items')
        .select('id, name, quantity')
        .eq('id', coffinId)
        .single();

      if (!fetchErr && item) {
        const nextQty = Math.max(0, (item.quantity || 0) - 1);
        const { error: updateErr } = await supabase
          .from('inventory_items')
          .update({ quantity: nextQty, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (!updateErr) {
          deductions.push({ id: item.id, name: item.name, previous: item.quantity, current: nextQty });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Baixa de estoque efetuada com sucesso',
      deductions
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}