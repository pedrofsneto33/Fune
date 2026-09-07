import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getFiscalConfig } from '@/lib/fiscal';
import { focusnfeTest } from '@/lib/fiscal/focusnfe';

export const dynamic = 'force-dynamic';

// POST /api/fiscal/test - testa conexao com o provedor configurado
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const config = await getFiscalConfig(auth.tenantId);
    if (!config) {
      return NextResponse.json({ ok: false, message: 'Provedor nao configurado' });
    }
    const result = await focusnfeTest(config);

    // Grava resultado do teste no tenant (timestamp + status)
    await supabaseAdmin
      .from('tenants')
      .update({
        fiscal_last_test_at: new Date().toISOString(),
        fiscal_last_test_status: result.ok ? 'ok' : ('error: ' + result.message).substring(0, 200),
      })
      .eq('id', auth.tenantId);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);
