/**
 * Carteirinha digital — token opaco por titular (P0-2).
 *
 * O CPF NUNCA é credencial: enumerar CPFs não devolve dado nenhum porque o
 * lookup da página é sempre por `holders.carteirinha_token` (uuid v4, único,
 * revogável por titular). O CPF no path existe apenas para legibilidade do
 * link — pode ser qualquer valor.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Valida o formato do token antes de qualquer ida ao banco. */
export function isValidCarteirinhaToken(
  token: string | null | undefined,
): boolean {
  if (typeof token !== 'string') return false;
  return UUID_RE.test(token.trim());
}

/** Só os dígitos do CPF (11) viram segmento do path; senão usa '0'. */
export function cpfPathSegment(cpf: string | null | undefined): string {
  const digits = String(cpf || '').replace(/\D/g, '');
  return digits.length === 11 ? digits : '0';
}

/**
 * Link canônico público da carteirinha: `/carteirinha/<cpf>?t=<token>`.
 * Usado no QR Code e no compartilhamento por WhatsApp.
 */
export function canonicalCarteirinhaPath(
  cpf: string | null | undefined,
  token: string,
): string {
  return `/carteirinha/${cpfPathSegment(cpf)}?t=${encodeURIComponent(token)}`;
}

/** CPF mascarado para exibição (LGPD): ***.123.456-** */
export function maskCpf(cpf: string | null | undefined): string {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return '-';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}
