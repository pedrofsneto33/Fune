export type UserRole = 'admin' | 'atendente' | 'motorista';

export interface UserSessionProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export const ROLE_PERMISSIONS = {
  admin: {
    canViewFinancialMetrics: true,
    canManageContracts: true,
    canManageFleet: true,
    canManageInventory: true,
    canManageDispatches: true,
    canManageCommissions: true,
    canDeleteRecords: true,
    allowedTabs: ['overview', 'associates', 'dispatches', 'fleet', 'inventory', 'commissions']
  },
  atendente: {
    canViewFinancialMetrics: true,
    canManageContracts: true,
    canManageFleet: false,
    canManageInventory: false,
    canManageDispatches: true,
    canManageCommissions: true,
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
    canDeleteRecords: false,
    allowedTabs: ['dispatches', 'fleet']
  }
};

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS['admin']): boolean {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['atendente'];
  return !!config[permission];
}