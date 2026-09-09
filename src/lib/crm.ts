// ============================================================
// FUNIL DE VENDAS DO ETERNITYOS (CRM interno do operador)
// Fonte única de estágios/origens — consumida por /api/leads,
// CrmTab e testes. NÃO duplicar estas listas.
// ============================================================

export const LEAD_STAGES = ['novo', 'contato', 'demo', 'proposta', 'ganho', 'perdido'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  novo: 'Novo',
  contato: 'Contato feito',
  demo: 'Demo agendada',
  proposta: 'Proposta enviada',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  novo: 'border-blue-500/40 text-blue-400',
  contato: 'border-cyan-500/40 text-cyan-400',
  demo: 'border-violet-500/40 text-violet-400',
  proposta: 'border-amber-500/40 text-amber-400',
  ganho: 'border-emerald-500/40 text-emerald-400',
  perdido: 'border-rose-500/40 text-rose-400',
};

// Fluxo de avanço: novo → contato → demo → proposta → ganho.
// 'perdido' é terminal lateral (não avança pelo fluxo).
const FLOW: LeadStage[] = ['novo', 'contato', 'demo', 'proposta', 'ganho'];

export function nextLeadStage(stage: LeadStage): LeadStage | null {
  const i = FLOW.indexOf(stage);
  if (i === -1 || i === FLOW.length - 1) return null;
  return FLOW[i + 1];
}

export function isValidLeadStage(v: unknown): v is LeadStage {
  return typeof v === 'string' && (LEAD_STAGES as readonly string[]).includes(v);
}

export const LEAD_SOURCES = ['manual', 'landing', 'indicacao', 'outbound'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  manual: 'Manual',
  landing: 'Landing Page',
  indicacao: 'Indicação',
  outbound: 'Prospecção ativa',
};

export function isValidLeadSource(v: unknown): v is LeadSource {
  return typeof v === 'string' && (LEAD_SOURCES as readonly string[]).includes(v);
}

/** Telefone BR: aceita 10-11 dígitos (com/sem DDI 55 → até 13). */
export function isValidPhoneDigits(v: string): boolean {
  const d = String(v || '').replace(/\D/g, '');
  return d.length >= 10 && d.length <= 13;
}

/** Link wa.me com DDI 55 quando o número não tem. */
export function waLink(phone: string, text: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  const withDDI = digits.length <= 11 ? '55' + digits : digits;
  return `https://wa.me/${withDDI}?text=${encodeURIComponent(text)}`;
}
