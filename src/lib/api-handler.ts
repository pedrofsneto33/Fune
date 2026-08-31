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

      let { data: roleRecord } = await supabaseAdmin
        .from('user_roles')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Auto-vínculo seguro: vincula o administrador autenticado ao tenant no primeiro login
      if (!roleRecord) {
        let tenantId = null;
        const { data: existingTenant } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existingTenant?.id) {
          tenantId = existingTenant.id;
        } else {
          const { data: createdTenant } = await supabaseAdmin
            .from('tenants')
            .insert([{ name: 'Funerária Matriz', cnpj: '00.000.000/0001-00' }])
            .select('id')
            .single();
          tenantId = createdTenant?.id;
        }

        if (tenantId) {
          const { data: createdRole } = await supabaseAdmin
            .from('user_roles')
            .insert([{
              user_id: user.id,
              tenant_id: tenantId,
              role: 'admin',
            }])
            .select('tenant_id, role')
            .single();

          roleRecord = createdRole;
        }
      }

      if (!roleRecord) {
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
    } catch (err: unknown) {
      console.error('Erro na execução da rota protegida:', err);
      return NextResponse.json(
        { error: 'Erro interno no servidor ao processar autenticação.' },
        { status: 500 }
      );
    }
  };
}
