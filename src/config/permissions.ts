export type AppRole = 'superadmin' | 'admin' | 'manager' | 'attendant' | 'driver' | 'financial';

export type Permission =
  | 'canManageSettings'
  | 'canManageUsers'
  | 'canManageFinancial'
  | 'canManageContracts'
  | 'canViewBurials'
  | 'canManageBurials'
  | 'canViewInventory';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  superadmin: [
    'canManageSettings',
    'canManageUsers',
    'canManageFinancial',
    'canManageContracts',
    'canViewBurials',
    'canManageBurials',
    'canViewInventory',
  ],
  admin: [
    'canManageSettings',
    'canManageUsers',
    'canManageFinancial',
    'canManageContracts',
    'canViewBurials',
    'canManageBurials',
    'canViewInventory',
  ],
  manager: [
    'canManageContracts',
    'canViewBurials',
    'canManageBurials',
    'canViewInventory',
  ],
  financial: [
    'canManageFinancial',
    'canManageContracts',
  ],
  attendant: [
    'canManageContracts',
    'canViewBurials',
  ],
  driver: [
    'canViewBurials',
  ],
};

export function hasPermission(role: AppRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isTabAllowed(role: AppRole | undefined | null, tab: string): boolean {
  if (!role) return false;
  switch (tab) {
    case 'settings':
      return hasPermission(role, 'canManageSettings');
    case 'financial':
      return hasPermission(role, 'canManageFinancial');
    case 'contracts':
      return hasPermission(role, 'canManageContracts');
    case 'burials':
      return hasPermission(role, 'canViewBurials');
    case 'inventory':
      return hasPermission(role, 'canViewInventory');
    default:
      return true;
  }
}
