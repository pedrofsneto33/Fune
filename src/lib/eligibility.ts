// Constante padrao de carência (reutilizacao em todo o projeto — nao duplicar o numero)
export const DEFAULT_GRACE_PERIOD_DAYS = 90;

// Helper: verifica se um contrato esta dentro do periodo de carência (para estorno de comissao)
export function isWithinGracePeriod(
  contractCreatedAt: string | Date,
  graceDays: number = DEFAULT_GRACE_PERIOD_DAYS,
): boolean {
  const start = new Date(contractCreatedAt);
  const now = new Date();
  const daysActive = Math.floor(
    Math.max(0, now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysActive < graceDays;
}

// ============================================================
// REGRA ÚNICA DE COBRANÇA (fonte única de verdade — NÃO duplicar!)
// Para cobrar/liberar: titular precisa estar ATIVO e, quando houver
// contrato vinculado, o contrato precisa estar ATIVO. Bilingue
// (ativo/active, inativo/inactive) por resiliência de dados legados.
// Consumidores: boleto, pix, asaas-batch, generate-cycles, payment-carnets,
// service-orders, convalescence, carteirinha e a UI (page.tsx).
// ============================================================
export function isHolderActive(status?: string | null): boolean {
  const s = String(status ?? '').trim().toLowerCase();
  return s !== 'inativo' && s !== 'inactive';
}

export function isContractActive(status?: string | null): boolean {
  const s = String(status ?? '').trim().toLowerCase();
  return s === 'ativo' || s === 'active';
}

export function isBillingEligible(
  holderStatus?: string | null,
  contractStatus?: string | null,
): boolean {
  return isHolderActive(holderStatus) && isContractActive(contractStatus);
}

