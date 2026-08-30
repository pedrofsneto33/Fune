import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: { auth: AuthContext; params?: any }
) => Promise<NextResponse>;

export function withAuth(
  handler: AuthenticatedHandler,
  allowedRoles?: string[]
) {
  return async (req: NextRequest, props?: { params?: Promise<any> }) => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token) {
        return NextResponse.json(
          { error: 'Não autorizado: cabeçalho de autenticação ausente ou inválido.' },
          { status: 401 }
        );
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Sessão inválida ou expirada.' },
          { status: 401 }
        );
      }

      const { data: roleRecord, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !roleRecord) {
        return NextResponse.json(
          { error: 'Acesso negado: nenhum vínculo de empresa/tenant encontrado para este usuário.' },
          { status: 403 }
        );
      }

      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(roleRecord.role) && roleRecord.role !== 'superadmin') {
          return NextResponse.json(
            { error: 'Acesso negado: seu perfil não tem permissão para realizar esta ação.' },
            { status: 403 }
          );
        }
      }

      const resolvedParams = props?.params ? await props.params : undefined;

      return await handler(req, {
        auth: {
          userId: user.id,
          tenantId: roleRecord.tenant_id,
          role: roleRecord.role,
        },
        params: resolvedParams,
      });
    } catch (err: any) {
      console.error('Erro na execução da rota protegida:', err);
      return NextResponse.json(
        { error: 'Erro interno no servidor ao processar autenticação.' },
        { status: 500 }
      );
    }
  };
}
