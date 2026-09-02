import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Initialize user endpoint - Returns user's current role status
 * SECURITY: Does NOT auto-create roles. Users must be assigned by an admin.
 */

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Token necessario' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
    }

    const { data: roleRecord } = await supabaseAdmin
      .from('user_roles')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleRecord) {
      return NextResponse.json({
        success: true,
        userId: user.id,
        role: roleRecord.role,
        tenantId: roleRecord.tenant_id,
        message: 'Usuario ja configurado',
      });
    }

    return NextResponse.json({
      success: false,
      userId: user.id,
      role: null,
      tenantId: null,
      message: 'Acesso pendente. Solicite a um administrador que vincule sua conta.',
      code: 'PENDING_APPROVAL',
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Erro: ' + err.message }, { status: 500 });
  }
}

// SECURITY: GET agora exige autenticacao + perfil superadmin
// Antes vazava lista de tenants + total de user_roles publicamente
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .limit(5);

  const { count: userCount } = await supabaseAdmin
    .from('user_roles')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    tenants: tenants || [],
    userRoles: userCount || 0,
    serviceRole: true,
  });
}, ['superadmin']);