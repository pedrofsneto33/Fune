import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // superadmin pode inspecionar qualquer tenant via ?tenantId=;
    // admin vê apenas o próprio (defesa em profundidade).
    const url = new URL(req.url);
    const qTenantId = url.searchParams.get('tenantId');
    const targetTenantId = auth.role === 'superadmin' && qTenantId ? qTenantId : auth.tenantId;

    const { data: sub, error } = await supabaseAdmin
      .from('saas_subscriptions')
      .select('plan, status, valor, next_due_date, grace_until, trial_ends_at')
      .eq('tenant_id', targetTenantId)
      .neq('status', 'canceled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar assinatura.' }, { status: 500 });
    }
    if (!sub) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa para este tenant.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, subscription: sub });
  } catch (err) {
    return serverError(err);
  }
}, ['superadmin', 'admin']);