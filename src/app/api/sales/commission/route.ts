import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seller = searchParams.get('seller');

    let query = supabaseAdmin
      .from('sales_commissions')
      .select('id, seller_name, amount, status, created_at, contracts(id, plan_id, status, holders(name))');

    if (seller) {
      query = query.eq('seller_name', seller);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, commissions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}