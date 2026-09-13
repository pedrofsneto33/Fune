import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';
import { checkRateLimit } from './rate-limiter';
import { logError } from './http-error';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: { auth: AuthContext; params?: any }
) => Promise<NextResponse>;

// Rate limit configuration
const API_RATE_LIMIT = { maxAttempts: 300, windowMs: 60000 }; // 300 requests per minute (dashboard dispara varias chamadas em paralelo)

export function withAuth(
  handler: AuthenticatedHandler,
  allowedRoles?: string[]
) {
  return async (req: NextRequest, props?: { params?: Promise<any> }) => {
    try {
      // Rate limiting geral por IP (NUNCA conta chamadas normais como "tentativa de login")
      const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                       req.headers.get('x-real-ip') ||
                       'unknown';

      const apiRateLimit = await checkRateLimit(`api:${clientIP}`, API_RATE_LIMIT);
      if (!apiRateLimit.allowed) {
        return NextResponse.json(
          { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((apiRateLimit.resetAt - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': API_RATE_LIMIT.maxAttempts.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(apiRateLimit.resetAt).toISOString(),
            }
          }
        );
      }

      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token) {
        return NextResponse.json(
          { error: 'Não autorizado: cabecalho de autenticação ausente ou inválido.' },
          { status: 401 }
        );
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Sessão invalida ou expirada.' },
          { status: 401 }
        );
      }

      const { data: roleRecord, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      // F-25b: usuário com 2+ vínculos (multi-tenant) quebrava o maybeSingle
      // e caía no catch 500. Agora: loga e pede seleção de unidade.
      if (roleError) {
        logError(roleError, 'api-handler/multi-role');
        return NextResponse.json(
          {
            error: 'Múltiplos vínculos encontrados. Selecione a unidade para continuar.',
            code: 'MULTI_TENANT_SELECT',
          },
          { status: 409 }
        );
      }

      // SECURITY FIX: Never auto-create roles
      // Users must be explicitly assigned to a tenant by an admin
      if (!roleRecord) {
        return NextResponse.json(
          { 
            error: 'Acesso pendente. Sua conta não está vinculada a nenhuma organização. Solicite a um administrador que conceda acesso.',
            code: 'PENDING_APPROVAL',
            userId: user.id
          },
          { status: 403 }
        );
      }

      // Bloco único de negação (fail-closed): sem role = sem acesso.
      // Removida duplicata legada (F-20).

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
      // SECURITY: Log error without sensitive data (via logger central)
      logError(err, 'api-handler');
      return NextResponse.json(
        { error: 'Erro interno no servidor. Tente novamente.' },
        { status: 500 }
      );
    }
  };
}
