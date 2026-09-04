export type AppRole = 'superadmin' | 'admin' | 'manager' | 'financial' | 'attendant' | 'driver';
export type UserRole = AppRole;

// ============================================
// HIERARQUIA DE PAPÉIS (RBAC)
// --------------------------------------------
// superadmin  -> DONO DO SISTEMA (multi-tenant). Vê e gerência TODOS os
//                tenants, cria novos tenants/clientes, altera plano comercial,
//                concede/revoga qualquer papel. Nunca pode ficar lockout.
//                Atribuído APENAS por outro superadmin (uso exclusivo do dono).
// admin       -> Dono/Gestor de UMA funerária (tenant). Opera 100% do próprio
//                tenant (config, financeiro, RBAC local, etc.), mas NÃO pode:
//                criar outros tenants, alterar plano comercial, conceder
//                superadmin, nem rebaixar/removeráá um superadmin.
// manager     -> Nível operacional elevado (contratos, capela, operações).
// financial   -> Financeiro.
// attendant   -> Atendimento (contratos, capela, convalescença).
// driver      -> Frota / burials (somente leitura).
// ============================================
export function isSuperAdminRole(role: AppRole | undefined | null): boolean {
  return role === 'superadmin';
}

export type Permission =
  | 'canManageSettings'
  | 'canManageUsers'
  | 'canManageFinancial'
  | 'canManageContracts'
  | 'canViewBurials'
  | 'canManageBurials'
  | 'canManageThanato'
  | 'canManageChapel'
  | 'canManageFleet'
  | 'canManageInventory'
  | 'canManageConvalescence'
  | 'canManageBenefits';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  superadmin: [
    'canManageSettings', 'canManageUsers', 'canManageFinancial', 'canManageContracts',
    'canViewBurials', 'canManageBurials', 'canManageThanato', 'canManageChapel',
    'canManageFleet', 'canManageInventory', 'canManageConvalescence', 'canManageBenefits',
  ],
  admin: [
    'canManageSettings', 'canManageUsers', 'canManageFinancial', 'canManageContracts',
    'canViewBurials', 'canManageBurials', 'canManageThanato', 'canManageChapel',
    'canManageFleet', 'canManageInventory', 'canManageConvalescence', 'canManageBenefits',
  ],
  manager: [
    'canManageContracts', 'canViewBurials', 'canManageBurials', 'canManageThanato',
    'canManageChapel', 'canManageFleet', 'canManageInventory', 'canManageConvalescence', 'canManageBenefits',
  ],
  financial: ['canManageFinancial', 'canManageContracts', 'canManageBenefits'],
  attendant: ['canManageContracts', 'canViewBurials', 'canManageChapel', 'canManageConvalescence', 'canManageBenefits'],
  driver: ['canViewBurials', 'canManageFleet'],
};

export function hasPermission(role: AppRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isTabAllowed(role: AppRole | undefined | null, tab: string): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  if (role === 'admin') return true;
  switch (tab) {
    case 'executive': return role === 'manager' || role === 'financial';
    case 'holders': return hasPermission(role, 'canManageContracts');
    case 'financial': return hasPermission(role, 'canManageFinancial');
    case 'burials': return hasPermission(role, 'canViewBurials');
    case 'thanatopraxy': return hasPermission(role, 'canManageThanato');
    case 'chapel': return hasPermission(role, 'canManageChapel');
    case 'fleet': return hasPermission(role, 'canManageFleet');
    case 'inventory': return hasPermission(role, 'canManageInventory');
    case 'convalescence': return hasPermission(role, 'canManageConvalescence');
    case 'benefits': return hasPermission(role, 'canManageBenefits');
    default: return false;
  }
}
