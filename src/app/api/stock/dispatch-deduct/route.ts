import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { dispatchId, deceasedName, coffinId, itemsUsed } = await req.json();

    if (!dispatchId) {
      return NextResponse.json({ error: 'ID do despacho não informado.' }, { status: 400 });
    }

    const deductions = [];

    // 1. Debitar Urna Funerária (se informada)
    if (coffinId) {
      const { data: item, error: fetchErr } = await supabase
        .from('stock_items')
        .select('id, name, quantity, min_quantity')
        .eq('id', coffinId)
        .single();

      if (!fetchErr && item) {
        const newQty = Math.max(0, item.quantity - 1);
        await supabase
          .from('stock_items')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        await supabase.from('stock_movements').insert({
          item_id: item.id,
          item_name: item.name,
          type: 'saida',
          quantity: 1,
          reason: `Atendimento OS Plantão: ${deceasedName || dispatchId}`,
          created_at: new Date().toISOString()
        });

        deductions.push({ id: item.id, name: item.name, remaining: newQty });
      }
    }

    // 2. Debitar Insumos Adicionais (Kits, Velas, Flores)
    if (Array.isArray(itemsUsed) && itemsUsed.length > 0) {
      for (const entry of itemsUsed) {
        const { data: item } = await supabase
          .from('stock_items')
          .select('id, name, quantity')
          .eq('id', entry.id)
          .single();

        if (item) {
          const qtyToDeduct = Number(entry.quantity) || 1;
          const newQty = Math.max(0, item.quantity - qtyToDeduct);

          await supabase
            .from('stock_items')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', item.id);

          await supabase.from('stock_movements').insert({
            item_id: item.id,
            item_name: item.name,
            type: 'saida',
            quantity: qtyToDeduct,
            reason: `Insumo OS Plantão: ${deceasedName || dispatchId}`,
            created_at: new Date().toISOString()
          });

          deductions.push({ id: item.id, name: item.name, remaining: newQty });
        }
      }
    }

    return NextResponse.json({
      success: true,
      dispatchId,
      deductions
    });

  } catch (error: any) {
    console.error('Erro na baixa automática de estoque:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}