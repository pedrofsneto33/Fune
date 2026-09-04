import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID, sanitizeString, isValidEmail } from '@/lib/validation';
import { getPlanByCode, checkUserLimit } from '@/lib/planLimits';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const queryTenantId = searchParams.get('tenant_id');
    
    // SECURITY: Validate UUID format to prevent injection
    let targetTenantId = auth.tenantId;
    if (auth.role === 'superadmin' && queryTenantId) {
      if (!isValidUUID(queryTenantId)) {
        return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400 });
      }
      targetTenantId = queryTenantId;
    }

    const { data: roles, error } = await supabaseAdmin
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .eq('tenant_id', targetTenantId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Erro ao listar permissões' }, { status: 500 });
    }

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map((usersData?.users || []).map(u => [u.id, u.email]));

    const enriched = (roles || []).map(r => ({
      ...r,
      email: emailById.get(r.user_id) || '(não encontrado)',
    }));

    return NextResponse.json({
      success: true,
      is_superadmin: auth.role === 'superadmin',
      current_user_id: auth.userId,
      roles: enriched,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao listar permissões' }, { status: 500 });
  }
}, ['superadmin', 'admin']);

// POST: Conceder ou atualizar a permissão de um colaborador por e-mail.
// Um superadmin pode informar tenant_id explicitamente para convidar o
// primeiro usuário de uma empresa recem-cadastrada (onboarding). Qualquer
// outro perfil sempre concede acesso dentro do proprio tenant, mesmo que
// tente enviar um tenant_id diferente.
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    
    // SECURITY: Sanitize inputs
    const email = sanitizeString(body.email || '', 254);
    const role = sanitizeString(body.role || '', 50);
    const tenant_id = body.tenant_id ? sanitizeString(body.tenant_id, 36) : null;

    const validRoles = ['superadmin', 'admin', 'manager', 'attendant', 'driver', 'financial'];

    if (!email || !role) {
      return NextResponse.json({ error: 'E-mail e cargo são obrigatórios.' }, { status: 400 });
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }
    
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 });
    }

    if (role === 'superadmin' && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Somente um Super Administrador pode conceder este nível de acesso.' }, { status: 403 });
    }

    // SECURITY: Validate UUID format
    let targetTenantId = auth.tenantId;
    if (auth.role === 'superadmin' && tenant_id) {
      if (!isValidUUID(tenant_id)) {
        return NextResponse.json({ error: 'tenant_id inválido.' }, { status: 400 });
      }
      targetTenantId = tenant_id;
    }

    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return NextResponse.json({ error: 'Erro ao consultar usuários cadastrados.' }, { status: 500 });
    }

    const targetUser = (usersData?.users || []).find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com este e-mail. O colaborador precisa criar a conta (fazer o primeiro login) antes de receber uma permissão.' },
        { status: 404 }
      );
    }

    // SECURITY: Um não-superadmin NUNCA pode alterar (rebaixar ou trocar) o papel de um superadmin.
    // Se o alvo ja e superadmin neste tenant, somente outro superadmin pode tocar nesse registro.
    if (auth.role !== 'superadmin') {
      const { data: existingSuper } = await supabaseAdmin
        .from('user_roles')
        .select('id, role')
        .eq('user_id', targetUser.id)
        .eq('tenant_id', targetTenantId)
        .maybeSingle();

      if (existingSuper?.role === 'superadmin') {
        return NextResponse.json(
          { error: 'Somente um Super Administrador pode alterar a permissão de um Super Administrador.' },
          { status: 403 }
        );
      }
    }

    // SECURITY: Nunca rebaixar o UNICO superadmin restante (evita lockout total do sistema).
    if (auth.role === 'superadmin' && role !== 'superadmin') {
      const { data: superRow } = await supabaseAdmin
        .from('user_roles')
        .select('id, role')
        .eq('user_id', targetUser.id)
        .eq('tenant_id', targetTenantId)
        .maybeSingle();

      if (superRow?.role === 'superadmin') {
        const { count } = await supabaseAdmin
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', targetTenantId)
          .eq('role', 'superadmin');

        if (count !== undefined && (count ?? 0) <= 1) {
          return NextResponse.json(
            { error: 'Não e possível rebaixar o unico Super Administrador do sistema.' },
            { status: 400 }
          );
        }
      }
    }

    // VERIFICAÇÃO DE LIMITE DE USUÁRIOS DO PLANO COMERCIAL
    // Se o usuário ja possui role neste tenant, trata-se de ATUALIZAÇÃO de
    // cargo e não conta como novo usuário (o upsert abaixo faz update).
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', targetUser.id)
      .eq('tenant_id', targetTenantId)
      .maybeSingle();

    if (!existingRole) {
      const { data: tenantRow } = await supabaseAdmin
        .from('tenants')
        .select('commercial_plan')
        .eq('id', targetTenantId)
        .single();
      const plan = getPlanByCode(tenantRow?.commercial_plan);

      const { count: usersCount } = await supabaseAdmin
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', targetTenantId);

      const userLimitCheck = checkUserLimit(plan, usersCount || 0);
      if (!userLimitCheck.allowed) {
        return NextResponse.json(
          { error: userLimitCheck.message, code: 'PLAN_LIMIT_EXCEEDED', plan: plan.code },
          { status: 402 }
        );
      }
    }

    const { data: saved, error: upsertErr } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        [{ user_id: targetUser.id, tenant_id: targetTenantId, role }],
        { onConflict: 'user_id,tenant_id' }
      )
      .select()
      .single();

    if (upsertErr) {
      return NextResponse.json({ error: 'Erro ao salvar permissão' }, { status: 500 });
    }

    return NextResponse.json({ success: true, roleRecord: saved });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao salvar permissão' }, { status: 500 });
  }
}, ['superadmin', 'admin']);

// DELETE: Removerá a permissão de acesso de um colaborador.
// Regras de segurança:
//  - Admin gerência apenas o proprio tenant; superadmin pode gerenciar qualquer tenant.
//  - Ninguém pode removeráá o proprio acesso (evita lockout acidental).
//  - Somente superadmin pode removeráá outro superadmin.
export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const { data: target, error: findErr } = await supabaseAdmin
      .from('user_roles')
      .select('id, user_id, role, tenant_id')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !target) {
      return NextResponse.json({ error: 'Permissão não encontrada.' }, { status: 404 });
    }

    // Escopo por tenant (admin so mexe no proprio; superadmin pode gerenciar outro)
    if (target.tenant_id !== auth.tenantId && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acesso negado: registro de outro tenant.' }, { status: 403 });
    }

    // Protege contra lockout acidental
    if (target.user_id === auth.userId) {
      return NextResponse.json({ error: 'Você não pode removeráá seu proprio acesso.' }, { status: 400 });
    }

    // Somente superadmin remove outro superadmin
    if (target.role === 'superadmin' && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Somente um Super Administrador pode removeráá este nível de acesso.' }, { status: 403 });
    }

    // SECURITY: Nunca removeráá o UNICO superadmin restante (evita lockout total do sistema)
    if (target.role === 'superadmin') {
      const { count } = await supabaseAdmin
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', target.tenant_id)
        .eq('role', 'superadmin');

      if (count !== undefined && (count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Não e possível removeráá o unico Super Administrador do sistema.' },
          { status: 400 }
        );
      }
    }

    const { error: delErr } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', id);

    if (delErr) {
      return NextResponse.json({ error: 'Erro ao removeráá permissão.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao removeráá permissão.' }, { status: 500 });
  }
}, ['superadmin', 'admin']);
