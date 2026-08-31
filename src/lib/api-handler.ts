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
          { error: 'Nao autorizado: cabecalho de autenticacao ausente ou invalido.' },
          { status: 401 }
        );
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Sessao invalida ou expirada.' },
          { status: 401 }
        );
      }

      let { data: roleRecord } = await supabaseAdmin
        .from('user_roles')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!roleRecord) {
        // Bootstrap seguro: so permite auto-vinculo como superadmin se o
        // sistema INTEIRO ainda nao tiver nenhum usuario vinculado a
        // nenhum tenant (ou seja, e literalmente o primeiro acesso de
        // todos). Depois que existir um unico registro em user_roles,
        // este bloco nunca mais executa para ninguem - novos usuarios
        // precisam ser cadastrados por um admin via /api/users/roles.
        const { count } = await supabaseAdmin
          .from('user_roles')
          .select('*', { count: 'exact', head: true });

        if (count === 0) {
          let tenantId: string | null = null;
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
              .insert([{ name: 'Funeraria Matriz', cnpj: '00.000.000/0001-00' }])
              .select('id')
              .single();
            tenantId = createdTenant?.id || null;
          }

          if (tenantId) {
            const { data: createdRole } = await supabaseAdmin
              .from('user_roles')
              .insert([{
                user_id: user.id,
                tenant_id: tenantId,
                role: 'superadmin',
              }])
              .select('tenant_id, role')
              .single();

            roleRecord = createdRole;
          }
        }
      }

      if (!roleRecord) {
        return NextResponse.json(
          { error: 'Acesso negado: seu usuario ainda nao foi vinculado a nenhuma unidade. Peca a um administrador para conceder seu acesso.' },
          { status: 403 }
        );
      }

      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(roleRecord.role) && roleRecord.role !== 'superadmin') {
          return NextResponse.json(
            { error: 'Acesso negado: seu perfil nao tem permissao para realizar esta acao.' },
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
      console.error('Erro na execucao da rota protegida:', err);
      return NextResponse.json(
        { error: 'Erro interno no servidor ao processar autenticacao.' },
        { status: 500 }
      );
    }
  };
}
