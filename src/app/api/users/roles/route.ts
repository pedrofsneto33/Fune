import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Listar colaboradores e permissoes da unidade do usuario logado
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data: roles, error } = await supabaseAdmin
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Resolve o e-mail de cada usuario a partir do Supabase Auth
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map((usersData?.users || []).map(u => [u.id, u.email]));

    const enriched = (roles || []).map(r => ({
      ...r,
      email: emailById.get(r.user_id) || '(nao encontrado)',
    }));

    return NextResponse.json({ success: true, roles: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao listar permissoes.' }, { status: 500 });
  }
}, ['superadmin', 'admin']);

// POST: Conceder ou atualizar a permissao de um colaborador por e-mail
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { email, role } = body;

    const validRoles = ['superadmin', 'admin', 'manager', 'attendant', 'driver', 'financial'];

    if (!email || !role) {
      return NextResponse.json({ error: 'E-mail e cargo sao obrigatorios.' }, { status: 400 });
    }
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Cargo invalido.' }, { status: 400 });
    }

    // Apenas superadmin pode conceder o cargo de superadmin
    if (role === 'superadmin' && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Somente um Super Administrador pode conceder este nivel de acesso.' }, { status: 403 });
    }

    // Resolve o user_id a partir do e-mail informado
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return NextResponse.json({ error: 'Erro ao consultar usuarios cadastrados.' }, { status: 500 });
    }

    const targetUser = (usersData?.users || []).find(
      u => u.email?.toLowerCase() === String(email).toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com este e-mail. O colaborador precisa criar a conta (fazer o primeiro login) antes de receber uma permissao.' },
        { status: 404 }
      );
    }

    // Grava/atualiza o vinculo, sempre dentro do tenant de quem esta concedendo
    const { data: saved, error: upsertErr } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        [{ user_id: targetUser.id, tenant_id: auth.tenantId, role }],
        { onConflict: 'user_id,tenant_id' }
      )
      .select()
      .single();

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, roleRecord: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao salvar permissao.' }, { status: 500 });
  }
}, ['superadmin', 'admin']);
