import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { count: activeContracts } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'active');

    const { count: totalDependents } = await supabaseAdmin
      .from('dependents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthTransactions } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount, type')
      .eq('tenant_id', auth.tenantId)
      .gte('transaction_date', startOfMonth.toISOString());

    let monthlyRevenue = 0;
    (monthTransactions || []).forEach((t) => {
      if (t.type === 'income') monthlyRevenue += Number(t.amount || 0);
    });

    const today = new Date().toISOString().split('T')[0];
    const { data: overduePayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'pending')
      .lt('due_date', today);

    let overdueAmount = 0;
    (overduePayments || []).forEach((p) => {
      overdueAmount += Number(p.amount || 0);
    });

    const { count: burialsThisMonth } = await supabaseAdmin
      .from('chapel_burials')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .gte('burial_date', startOfMonth.toISOString());

    return NextResponse.json({
      totalLives: (activeContracts || 0) + (totalDependents || 0),
      activeContracts: activeContracts || 0,
      monthlyRevenue,
      overdueAmount,
      overdueCount: overduePayments?.length || 0,
      burialsThisMonth: burialsThisMonth || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao calcular KPIs.' }, { status: 500 });
  }
});
