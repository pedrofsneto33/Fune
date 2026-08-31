import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const tenantId = auth.tenantId;

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
      if (tx.type === 'income') {
        grossRevenue += val;
      } else if (tx.type === 'expense') {
        expenses += val;
      }
    });

    const netRevenue = Math.max(0, grossRevenue - expenses);
    const solvencyTarget = grossRevenue * 0.10;
    const technicalTarget = netRevenue * 0.12;

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
}, ['superadmin', 'admin', 'financial']);
