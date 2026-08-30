import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data: contracts, error } = await supabaseAdmin
      .from('contracts')
      .select('id, holder_id, plan_id, status, holders(*), plans(*)')
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'active');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, total: contracts?.length || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);
