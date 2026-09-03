/**
 * Plano comercial do EternityOS
 * Define os 3 planos oficiais com seus limites e valores.
 *
 * IMPORTANTE: A tabela `plans` no banco guarda os planos associativos
 * (ex: "Familiar Ouro") criados por cada funerária. Já este módulo
 * define o PLANO COMERCIAL (plano de assinatura do próprio sistema)
 * que controla os LIMITES de uso por tenant.
 */

export type CommercialPlanCode = 'essencial' | 'profissional' | 'enterprise';

export interface CommercialPlan {
  code: CommercialPlanCode;
  name: string;
  priceMonthly: number;
  maxHolders: number;      // limite de titulares (associados)
  maxUsers: number;        // limite de usuários do sistema (login)
  maxDependentsPerHolder: number; // limite de dependentes por titular
  features: string[];
}

export const COMMERCIAL_PLANS: Record<CommercialPlanCode, CommercialPlan> = {
  essencial: {
    code: 'essencial',
    name: 'Essencial',
    priceMonthly: 397,
    maxHolders: 200,
    maxUsers: 5,
    maxDependentsPerHolder: 4,
    features: [
      'Até 200 titulares',
      'Até 5 usuários',
      'Até 4 dependentes por titular',
      'Gestão de contratos e dependentes',
      'Cobrança via PIX e boleto',
      'Controle de capelas e velórios',
      'Suporte por WhatsApp',
    ],
  },
  profissional: {
    code: 'profissional',
    name: 'Profissional',
    priceMonthly: 597,
    maxHolders: 1000,
    maxUsers: 20,
    maxDependentsPerHolder: 8,
    features: [
      'Até 1.000 titulares',
      'Até 20 usuários',
      'Até 8 dependentes por titular',
      'Tudo do plano Essencial',
      'Gestão de frota e motoristas',
      'Tanatopraxia e preparação',
      'Dashboard financeiro completo',
      'Integração WhatsApp',
      'Suporte prioritário',
    ],
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 0, // sob consulta
    maxHolders: Number.MAX_SAFE_INTEGER, // ilimitado
    maxUsers: Number.MAX_SAFE_INTEGER,   // ilimitado
    maxDependentsPerHolder: 20,
    features: [
      'Titulares ilimitados',
      'Usuários ilimitados',
      'Tudo do plano Profissional',
      'Multi-tenancy (várias filiais)',
      'API personalizada',
      'Relatórios avançados (BI)',
      'Treinamento da equipe',
      'Suporte 24/7 dedicado',
      'SLA garantido',
    ],
  },
};

export const PLAN_CODE_FALLBACK: CommercialPlanCode = 'essencial';

/**
 * Obtém o plano comercial de um tenant com base no código salvo.
 * Se o tenant não tiver plano definido, assume o Essencial.
 */
export function getPlanByCode(code?: string | null): CommercialPlan {
  if (code && code in COMMERCIAL_PLANS) {
    return COMMERCIAL_PLANS[code as CommercialPlanCode];
  }
  return COMMERCIAL_PLANS[PLAN_CODE_FALLBACK];
}

export interface PlanUsageResult {
  allowed: boolean;
  exceeded: 'holders' | 'users' | 'dependents' | null;
  limit: number;
  current: number;
  plan: CommercialPlan;
  message: string;
}

/**
 * Verifica se o tenant ainda tem espaço para cadastrar um novo titular
 * respeitando o limite do plano comercial.
 */
export function checkHolderLimit(
  plan: CommercialPlan,
  currentHoldersCount: number
): PlanUsageResult {
  const allowed = currentHoldersCount < plan.maxHolders;
  return {
    allowed,
    exceeded: allowed ? null : 'holders',
    limit: plan.maxHolders,
    current: currentHoldersCount,
    plan,
    message: allowed
      ? `OK (${currentHoldersCount}/${plan.maxHolders} titulares)`
      : `Limite de titulares do plano ${plan.name} atingido: ${plan.maxHolders}/${plan.maxHolders}. Faça upgrade para o próximo plano.`,
  };
}

/**
 * Verifica se o tenant pode criar outro usuário (login) conforme o plano.
 */
export function checkUserLimit(
  plan: CommercialPlan,
  currentUsersCount: number
): PlanUsageResult {
  const allowed = currentUsersCount < plan.maxUsers;
  return {
    allowed,
    exceeded: allowed ? null : 'users',
    limit: plan.maxUsers,
    current: currentUsersCount,
    plan,
    message: allowed
      ? `OK (${currentUsersCount}/${plan.maxUsers} usuários)`
      : `Limite de usuários do plano ${plan.name} atingido: ${plan.maxUsers}/${plan.maxUsers}. Faça upgrade para o próximo plano.`,
  };
}

/**
 * Formata o valor mensal do plano em moeda brasileira.
 */
export function formatPlanPrice(plan: CommercialPlan): string {
  if (plan.code === 'enterprise') return 'Sob consulta';
  return plan.priceMonthly.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}