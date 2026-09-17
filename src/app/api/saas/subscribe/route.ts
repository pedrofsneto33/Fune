import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError, logError } from '@/lib/http-error';
import { ensureSaasCustomer, createSaasSubscription } from '@/lib/asaasSaas';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLANS = ['essencial', 'profissional', 'enterprise'];

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { tenantId, plan, valor, nextDueDate } = body as {
      tenantId?: string; plan?: string; valor?: number; nextDueDate?: string;
    };

    if (!tenantId || !UUID_RE.test(tenantId)) {
      return NextResponse.json({ error: 'tenantId inválido.' }, { status: 400 });
    }
    if (!plan || !PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Plano inválido. Use essencial, profissional ou enterprise.' }, { status: 400 });
    }
    const valorNum = Number(valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      return NextResponse.json({ error: 'valor deve ser maior que zero.' }, { status: 400 });
    }

    // superadmin pode assinar para qualquer tenant; admin só o próprio
    const targetTenantId = auth.role === 'superadmin' ? tenantId : auth.tenantId;
    if (auth.role !== 'superadmin' && targetTenantId !== tenantId) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, cnpj')
      .eq('id', targetTenantId)
      .single();
    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant não localizado.' }, { status: 404 });
    }

    // Dono do tenant: primeiro admin/superadmin vinculado (para o e-mail do customer Asaas)
    const { data: ownerRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .eq('tenant_id', targetTenantId)
      .in('role', ['admin', 'superadmin'])
      .limit(1)
      .maybeSingle();

    let ownerEmail = '';
    if (ownerRole?.user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ownerRole.user_id);
      ownerEmail = userData?.user?.email || '';
    }

    const customer = await ensureSaasCustomer({
      tenantId: targetTenantId,
      tenantName: tenant.name,
      tenantCnpj: tenant.cnpj || '',
      ownerEmail,
    });
    if (!customer.ok) {
      logError(customer.error, '[saas/subscribe] ensureSaasCustomer falhou');
      return NextResponse.json({ error: customer.error }, { status: 400 });
    }

    const dueDate = nextDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const sub = await createSaasSubscription({
      tenantId: targetTenantId,
      customerId: customer.customerId,
      valor: valorNum,
      nextDueDate: dueDate,
    });
    if (!sub.ok) {
      logError(sub.error, '[saas/subscribe] createSaasSubscription falhou');
      return NextResponse.json({ error: sub.error }, { status: 400 });
    }

    const graceUntil = new Date(new Date(dueDate).getTime() + 7 * 86400000).toISOString();
    const { error: insertError } = await supabaseAdmin.from('saas_subscriptions').insert({
      tenant_id: targetTenantId,
      plan,
      status: 'active',
      valor: valorNum,
      asaas_customer_id: customer.customerId,
      asaas_subscription_id: sub.subscriptionId,
      next_due_date: dueDate,
      grace_until: graceUntil,
    });
    if (insertError) {
      // Assinatura já existe no Asaas sem registro local: não engolir (orfão).
      logError(insertError, '[saas/subscribe] falha ao registrar assinatura local');
      return NextResponse.json(
        { error: 'Assinatura criada no Asaas, mas falha ao registrar localmente: ' + insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, subscription_id: sub.subscriptionId }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}, ['superadmin']);