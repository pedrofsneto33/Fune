import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError, logError } from '@/lib/http-error';
import { cancelSaasSubscription } from '@/lib/asaasSaas';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { tenantId } = body as { tenantId?: string };
    const targetTenantId = auth.role === 'superadmin' && tenantId ? tenantId : auth.tenantId;

    const { data: sub, error: subError } = await supabaseAdmin
      .from('saas_subscriptions')
      .select('id, asaas_subscription_id')
      .eq('tenant_id', targetTenantId)
      .neq('status', 'canceled')
      .maybeSingle();
    if (subError) {
      logError(subError, '[saas/cancel] erro ao buscar assinatura');
      return NextResponse.json({ error: 'Erro ao buscar assinatura.' }, { status: 500 });
    }
    if (!sub) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa para este tenant.' }, { status: 404 });
    }

    const cancel = await cancelSaasSubscription(sub.asaas_subscription_id);
    if (!cancel.ok) {
      logError(cancel.error, '[saas/cancel] cancelSaasSubscription falhou');
      return NextResponse.json({ error: cancel.error }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('saas_subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', sub.id)
      .eq('tenant_id', targetTenantId);
    if (updateError) {
      // Cancelada no Asaas mas ativa localmente: não engolir (fatura continuaria).
      logError(updateError, '[saas/cancel] falha ao cancelar localmente');
      return NextResponse.json(
        { error: 'Cancelada no Asaas, mas falha ao atualizar localmente: ' + updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}, ['superadmin']);