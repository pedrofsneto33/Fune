export interface EligibilityResult {
  isEligible: boolean;
  status: 'COBERTO' | 'CARENCIA_PENDENTE' | 'INADIMPLENTE' | 'NAO_ENCONTRADO';
  reason: string;
  daysActive: number;
  requiredGraceDays: number;
  pendingGraceDays: number;
  suggestedExemptionFee: number;
  isAccidentalDeathExempt: boolean;
  overduePaymentsCount: number;
  totalOverdueAmount: number;
}

export function calculateEligibility(params: {
  contractCreatedAt: string | Date;
  dependentIncludedAt?: string | Date | null;
  deathType: 'natural' | 'acidental';
  monthlyValue: number;
  unpaidOverduePayments: Array<{ amount: number; due_date: string }>;
  customGraceDaysNatural?: number;
}): EligibilityResult {
  const {
    contractCreatedAt,
    dependentIncludedAt,
    deathType,
    monthlyValue,
    unpaidOverduePayments = [],
    customGraceDaysNatural = 90
  } = params;

  const now = new Date();
  const startDate = new Date(dependentIncludedAt || contractCreatedAt);
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 1. Checar Inadimplência Crítica (> 0 parcelas atrasadas)
  const overdueCount = unpaidOverduePayments.length;
  const totalOverdue = unpaidOverduePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  if (overdueCount > 0) {
    return {
      isEligible: false,
      status: 'INADIMPLENTE',
      reason: `Contrato possui ${overdueCount} mensalidade(s) em atraso somando R$ ${totalOverdue.toFixed(2)}. Regularize para liberar a cobertura contratual.`,
      daysActive,
      requiredGraceDays: customGraceDaysNatural,
      pendingGraceDays: 0,
      suggestedExemptionFee: totalOverdue,
      isAccidentalDeathExempt: false,
      overduePaymentsCount: overdueCount,
      totalOverdueAmount: totalOverdue
    };
  }

  // 2. Morte Acidental: Isenta de carência se o contrato estiver ativo há pelo menos 24h
  if (deathType === 'acidental') {
    if (daysActive >= 1) {
      return {
        isEligible: true,
        status: 'COBERTO',
        reason: 'Cobertura Integral autorizada (Morte Acidental isenta de carência contratual mediante B.O./Laudo IML).',
        daysActive,
        requiredGraceDays: 1,
        pendingGraceDays: 0,
        suggestedExemptionFee: 0,
        isAccidentalDeathExempt: true,
        overduePaymentsCount: 0,
        totalOverdueAmount: 0
      };
    }
  }

  // 3. Morte Natural: Exige cumprimento integral da carência (padrão 90 dias)
  const requiredGrace = customGraceDaysNatural;
  if (daysActive >= requiredGrace) {
    return {
      isEligible: true,
      status: 'COBERTO',
      reason: `Cobertura Integral autorizada. Carência de ${requiredGrace} dias integralmente cumprida (${daysActive} dias de vigência).`,
      daysActive,
      requiredGraceDays: requiredGrace,
      pendingGraceDays: 0,
      suggestedExemptionFee: 0,
      isAccidentalDeathExempt: false,
      overduePaymentsCount: 0,
      totalOverdueAmount: 0
    };
  }

  // 4. Carência Incompleta -> Sugerir taxa de antecipação/coparticipação proporcional
  const pendingDays = requiredGrace - daysActive;
  // Regra padrão de mercado: Fração de carência restante aplicada sobre custo padrão de urna/serviço ou taxa de adesão
  const standardServiceCost = monthlyValue * 15; // Equivalente a 15 mensalidades de referência
  const fractionRemaining = pendingDays / requiredGrace;
  const suggestedFee = Number((standardServiceCost * fractionRemaining).toFixed(2));

  return {
    isEligible: false,
    status: 'CARENCIA_PENDENTE',
    reason: `Falecido em período de carência. Faltam ${pendingDays} dias para completar os ${requiredGrace} dias regulamentares (${daysActive} dias decorridos).`,
    daysActive,
    requiredGraceDays: requiredGrace,
    pendingGraceDays: pendingDays,
    suggestedExemptionFee: Math.max(suggestedFee, monthlyValue * 3),
    isAccidentalDeathExempt: false,
    overduePaymentsCount: 0,
    totalOverdueAmount: 0
  };
}