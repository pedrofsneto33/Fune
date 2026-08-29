export type UserRole = 'admin' | 'atendente' | 'motorista';

export interface UserSessionProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewFinancialMetrics: boolean;
  canManageContracts: boolean;
  canManageFleet: boolean;
  canManageInventory: boolean;
  canManageDispatches: boolean;
  canManageCommissions: boolean;
  canManageSettings: boolean;
  canDeleteRecords: boolean;
  allowedTabs: string[];
}> = {
  admin: {
    canViewFinancialMetrics: true,
    canManageContracts: true,
    canManageFleet: true,
    canManageInventory: true,
    canManageDispatches: true,
    canManageCommissions: true,
    canManageSettings: true,
    canDeleteRecords: true,
    allowedTabs: ['overview', 'associates', 'dispatches', 'fleet', 'inventory', 'commissions', 'settings']
  },
  atendente: {
    canViewFinancialMetrics: true,
    canManageContracts: true,
    canManageFleet: false,
    canManageInventory: false,
    canManageDispatches: true,
    canManageCommissions: true,
    canManageSettings: false,
    canDeleteRecords: false,
    allowedTabs: ['overview', 'associates', 'dispatches', 'commissions']
  },
  motorista: {
    canViewFinancialMetrics: false,
    canManageContracts: false,
    canManageFleet: true,
    canManageInventory: false,
    canManageDispatches: true,
    canManageCommissions: false,
    canManageSettings: false,
    canDeleteRecords: false,
    allowedTabs: ['dispatches', 'fleet']
  }
};

export function hasPermission(
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS['admin']
): boolean {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['atendente'];
  return !!config[permission];
}

export function isTabAllowed(role: UserRole, tab: string): boolean {
  const allowed = ROLE_PERMISSIONS[role]?.allowedTabs || [];
  return allowed.includes(tab);
}