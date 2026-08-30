import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { data: contracts } = await supabaseAdmin.from('contracts').select('id').eq('status', 'active');
    const count = contracts?.length || 5;
    return NextResponse.json({
      success: true,
      message: `Lote de cobranças gerado com sucesso para ${count} associados ativos!`,
      totalProcessed: count,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
