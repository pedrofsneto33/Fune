import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy de segurança (Next 16+: convenção `src/proxy.ts`): gera nonce por
 * requisição e injeta CSP restritiva.
 *
 * P0-1: o nonce PRECISA ir no REQUEST (header Content-Security-Policy), não só
 * no response. É de lá que o Next lê o nonce para marcar os scripts inline do
 * framework; sem isso o bundle de hydration é bloqueado por script-src e a
 * página fica presa em "Verificando credenciais e permissões de acesso...".
 * Ref: https://nextjs.org/docs/app/guides/content-security-policy
 *
 * Este proxy NÃO autentica e NÃO redireciona. As rotas públicas
 * (/landing, /login, /carteirinha, /api/auth, /api/public, /termos,
 * /privacidade, /cookies, /track, /assinatura-suspensa) passam direto; o gate
 * de sessão é do AuthGuard (client, src/components/AuthGuard.tsx) e do
 * withAuth (API).
 */
export default function proxy(request: NextRequest) {
  return handleSecurityHeaders(request);
}

function handleSecurityHeaders(request: NextRequest) {
  // Gerar nonce criptograficamente seguro (16 bytes = 32 hex chars)
  const nonce = crypto.randomUUID().replace(/-/g, '');
  // React usa eval em dev para reconstruir stack traces (doc oficial do Next)
  const isDev = process.env.NODE_ENV === 'development';

  // CSP restritiva com nonce — sem 'unsafe-inline' em scripts
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.asaas.com https://sandbox.asaas.com https://homologacao.focusnfe.com.br https://api.focusnfe.com.br https://*.sentry.io https://*.ingest.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Clonar headers e injetar nonce + CSP ANTES do render (request). O Next só
  // propaga o nonce aos seus próprios scripts se enxergar o header no request.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Adicionar headers de segurança
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

export const config = {
  // Landing/privacidade/carteirinha/API pública fora do proxy: deixa o Edge
  // cachear /landing como estática e nunca bloqueia fetch server-side anônimo.
  // Rotas fora do matcher (públicas, sem CSP nonce): _next/static,
  // _next/image, favicon.ico, /landing, /privacidade, /carteirinha,
  // /api/public. As demais (incluindo /login, /api/auth, /track)
  // recebem headers de segurança, mas o proxy NÃO autentica nem
  // redireciona (ver contrato L13).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|landing|privacidade|carteirinha|api/public).*)'],
};
