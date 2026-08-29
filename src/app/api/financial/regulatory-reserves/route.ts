import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || 'a0000000-0000-0000-0000-000000000001';

    // 1. Buscar transações de receita do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: transactions, error: txErr } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount, type')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 400 });
    }

    let grossRevenue = 0;
    let expenses = 0;

    (transactions || []).forEach(tx => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'receita') {
        grossRevenue += val;
      } else if (tx.type === 'despesa') {
        expenses += val;
      }
    });

    const netRevenue = Math.max(0, grossRevenue - expenses);
    const solvencyTarget = grossRevenue * 0.10;      // 10% Faturamento Bruto (Art. 8º, I)
    const technicalTarget = netRevenue * 0.12;      // 12% Receita Líquida (Art. 8º, II)

    // 2. Buscar status do mês gravado
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const { data: currentReserve } = await supabaseAdmin
      .from('regulatory_reserves')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('reference_month', monthKey)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        referenceMonth: monthKey,
        grossRevenue,
        netRevenue,
        solvencyTarget,
        technicalTarget,
        totalRequiredProvision: solvencyTarget + technicalTarget,
        appliedAmount: currentReserve?.applied_amount || 0.00,
        status: currentReserve?.status || 'calculado',
        regulatoryBasis: 'Lei Federal 13.261/2016'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}