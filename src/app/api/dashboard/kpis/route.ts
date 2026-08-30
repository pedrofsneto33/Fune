import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { count: holdersCount } = await supabaseAdmin
      .from('holders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId);

    const { count: depsCount } = await supabaseAdmin
      .from('dependents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId);

    const { count: burialsCount } = await supabaseAdmin
      .from('chapel_burials')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId);

    const totalLives = (holdersCount || 0) + (depsCount || 0);
    const estimatedRevenue = (holdersCount || 0) * 69.90;

    return NextResponse.json({
      totalLives: totalLives || 0,
      activeContracts: holdersCount || 0,
      monthlyRevenue: estimatedRevenue || 0,
      overdueAmount: 0,
      overdueCount: 0,
      burialsThisMonth: burialsCount || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);
