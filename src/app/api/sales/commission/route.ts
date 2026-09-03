import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data: commissions, error } = await supabaseAdmin
      .from('commissions')
      .select('id, seller_name, amount, status, created_at, tenant_id, contracts(id, holders(name))')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, commissions: commissions || [] });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'financial']);
