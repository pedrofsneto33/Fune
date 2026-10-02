/**
 * URL publica da aplicacao — base de todo link que sai do sistema para
 * fora (carteirinha, guia de sepultamento, reset de senha, WhatsApp).
 *
 * Origem do bug (corrigido): `next.config.ts` injetava
 * `NEXT_PUBLIC_APP_URL || 'http://localhost:3000'` no bundle do cliente.
 * Em producao a variavel nao existe na Vercel, o fallback hardcoded era
 * embutido no bundle e `process.env.NEXT_PUBLIC_APP_URL` valia
 * `http://localhost:3000` — truthy, entao o `|| window.location.origin`
 * nunca disparava. Todo link copiado saia apontando para localhost.
 *
 * Regra: a origem real do navegador manda, desde que nao seja localhost.
 * Variavel de ambiente so entra como fallback (dev local, SSR, testes).
 */

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function normalize(value: string | null | undefined): string {
  return (value || '').trim().replace(/\/+$/, '');
}

function isLocal(value: string): boolean {
  return LOCAL_ORIGIN_RE.test(value);
}

export interface PublicBaseUrlOptions {
  /** Valor cru de `NEXT_PUBLIC_APP_URL` (injetavel para teste). */
  envUrl?: string | null;
  /** `window.location.origin` (injetavel para teste; null = fora do browser). */
  origin?: string | null;
}

/**
 * Resolve a base publica. Retorna string vazia quando nao ha informacao
 * alguma — quem chama decide o que fazer (ex.: cair para link relativo).
 */
export function resolvePublicBaseUrl(
  options: PublicBaseUrlOptions = {},
): string {
  const envUrl = normalize(
    options.envUrl !== undefined
      ? options.envUrl
      : process.env.NEXT_PUBLIC_APP_URL,
  );
  const origin = normalize(
    options.origin !== undefined
      ? options.origin
      : typeof window !== 'undefined'
        ? window.location?.origin
        : null,
  );

  // Navegador em dominio real: soberano. Ignora env errada ou ausente.
  if (origin && !isLocal(origin)) return origin;

  // Dev local / SSR com env configurada.
  if (envUrl) return envUrl;

  // Ultimo recurso: o proprio localhost do navegador.
  return origin;
}
