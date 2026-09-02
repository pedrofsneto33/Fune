import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';
import { checkRateLimit } from './rate-limiter';

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

      const apiRateLimit = checkRateLimit(`api:${clientIP}`, API_RATE_LIMIT);
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

      if (!roleRecord) {
        return NextResponse.json(
          { error: 'Acesso negado: seu usuario ainda nao foi vinculado a nenhuma unidade.' },
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
      // SECURITY: Log error without sensitive data
      console.error('[API_ERROR]', {
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
        errorCode: (err as Error).message?.split(':')[0] || 'UNKNOWN',
        // Never log tokens or personal data
      });
      return NextResponse.json(
        { error: 'Erro interno no servidor. Tente novamente.' },
        { status: 500 }
      );
    }
  };
}
