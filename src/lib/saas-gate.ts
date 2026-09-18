export type SaasGateStatus = 'active' | 'past_due' | 'suspended' | 'blocked';

export interface SaasSubInput {
  status: string;
  next_due_date: string | null;
  trial_ends_at: string | null;
}

// Dias apos o vencimento. Configuravel em 1 lugar.
export const GRACE_DAYS = 7;
export const BLOCK_DAYS = 15; // total desde o vencimento

/**
 * Calculo LAZY do status da assinatura a partir de datas. Sem cron.
 * Regras:
 *   - sub === null              -> 'active' (sem billing = nao bloqueia)
 *   - status === 'canceled'     -> 'blocked' (sempre)
 *   - usa next_due_date; se trial, usa trial_ends_at
 *   - sem data valida           -> 'active' (deixa passar)
 *   - now < due                 -> 'active'
 *   - due <= now < due+GRACE    -> 'past_due' (banner)
 *   - due+GRACE <= now < due+BLOCK -> 'suspended' (read-only)
 *   - now >= due+BLOCK          -> 'blocked'
 */
export function computeStatus(
  sub: SaasSubInput | null | undefined,
  now: number = Date.now(),
): SaasGateStatus {
  if (!sub) return 'active';
  if (sub.status === 'canceled') return 'blocked';

  const dueStr = sub.status === 'trial' ? sub.trial_ends_at : sub.next_due_date;
  if (!dueStr) return 'active';

  const due = new Date(dueStr).getTime();
  if (!Number.isFinite(due)) return 'active';

  const dayMs = 86400000;
  const graceAt = due + GRACE_DAYS * dayMs;
  const blockAt = due + BLOCK_DAYS * dayMs;

  if (now < due) return 'active';
  if (now < graceAt) return 'past_due';
  if (now < blockAt) return 'suspended';
  return 'blocked';
}

export function needsBanner(s: SaasGateStatus): boolean {
  return s === 'past_due';
}

export function needsReadOnly(s: SaasGateStatus): boolean {
  return s === 'suspended' || s === 'blocked';
}

export function needsBlock(s: SaasGateStatus): boolean {
  return s === 'blocked';
}
