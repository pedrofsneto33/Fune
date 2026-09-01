import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID, sanitizeString, isValidEmail } from '@/lib/validation';

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
      return NextResponse.json({ error: 'Erro ao listar permissoes' }, { status: 500 });
    }

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map((usersData?.users || []).map(u => [u.id, u.email]));

    const enriched = (roles || []).map(r => ({
      ...r,
      email: emailById.get(r.user_id) || '(nao encontrado)',
    }));

    return NextResponse.json({ success: true, roles: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao listar permissoes' }, { status: 500 });
  }
}, ['superadmin', 'admin']);

// POST: Conceder ou atualizar a permissao de um colaborador por e-mail.
// Um superadmin pode informar tenant_id explicitamente para convidar o
// primeiro usuario de uma empresa recem-cadastrada (onboarding). Qualquer
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
      return NextResponse.json({ error: 'E-mail e cargo sao obrigatorios.' }, { status: 400 });
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail invalido.' }, { status: 400 });
    }
    
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Cargo invalido.' }, { status: 400 });
    }

    if (role === 'superadmin' && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Somente um Super Administrador pode conceder este nivel de acesso.' }, { status: 403 });
    }

    // SECURITY: Validate UUID format
    let targetTenantId = auth.tenantId;
    if (auth.role === 'superadmin' && tenant_id) {
      if (!isValidUUID(tenant_id)) {
        return NextResponse.json({ error: 'tenant_id invalido.' }, { status: 400 });
      }
      targetTenantId = tenant_id;
    }

    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return NextResponse.json({ error: 'Erro ao consultar usuarios cadastrados.' }, { status: 500 });
    }

    const targetUser = (usersData?.users || []).find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com este e-mail. O colaborador precisa criar a conta (fazer o primeiro login) antes de receber uma permissao.' },
        { status: 404 }
      );
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
      return NextResponse.json({ error: 'Erro ao salvar permissao' }, { status: 500 });
    }

    return NextResponse.json({ success: true, roleRecord: saved });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao salvar permissao' }, { status: 500 });
  }
}, ['superadmin', 'admin']);
