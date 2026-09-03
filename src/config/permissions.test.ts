import { isTabAllowed, hasPermission, UserRole } from './permissions';

describe('RBAC Permissions', () => {
  describe('isTabAllowed', () => {
    it('superadmin should access all tabs', () => {
      const tabs = ['executive', 'holders', 'financial', 'fleet', 'inventory', 'burials', 'thanatopraxy', 'chapel', 'settings'];
      tabs.forEach(tab => {
        expect(isTabAllowed('superadmin' as UserRole, tab)).toBe(true);
      });
    });

    it('admin should access all tabs (same as superadmin for tabs)', () => {
      expect(isTabAllowed('admin' as UserRole, 'executive')).toBe(true);
      expect(isTabAllowed('admin' as UserRole, 'holders')).toBe(true);
      expect(isTabAllowed('admin' as UserRole, 'financial')).toBe(true);
      expect(isTabAllowed('admin' as UserRole, 'settings')).toBe(true);
    });

    it('driver should only access fleet and burials', () => {
      expect(isTabAllowed('driver' as UserRole, 'fleet')).toBe(true);
      expect(isTabAllowed('driver' as UserRole, 'burials')).toBe(true);
      expect(isTabAllowed('driver' as UserRole, 'executive')).toBe(false);
      expect(isTabAllowed('driver' as UserRole, 'holders')).toBe(false);
      expect(isTabAllowed('driver' as UserRole, 'financial')).toBe(false);
    });

    it('financial should access financial and holders tabs', () => {
      expect(isTabAllowed('financial' as UserRole, 'financial')).toBe(true);
      expect(isTabAllowed('financial' as UserRole, 'holders')).toBe(true);
      expect(isTabAllowed('financial' as UserRole, 'executive')).toBe(true);
      expect(isTabAllowed('financial' as UserRole, 'fleet')).toBe(false);
    });

    it('attendant should access contracts, burials, chapel', () => {
      expect(isTabAllowed('attendant' as UserRole, 'holders')).toBe(true);
      expect(isTabAllowed('attendant' as UserRole, 'burials')).toBe(true);
      expect(isTabAllowed('attendant' as UserRole, 'chapel')).toBe(true);
      expect(isTabAllowed('attendant' as UserRole, 'financial')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('superadmin should have all permissions', () => {
      expect(hasPermission('superadmin' as UserRole, 'canManageUsers')).toBe(true);
      expect(hasPermission('superadmin' as UserRole, 'canManageFinancial')).toBe(true);
      expect(hasPermission('superadmin' as UserRole, 'canManageSettings')).toBe(true);
    });

    it('admin should have same permissions as superadmin', () => {
      expect(hasPermission('admin' as UserRole, 'canManageUsers')).toBe(true);
      expect(hasPermission('admin' as UserRole, 'canManageFinancial')).toBe(true);
      expect(hasPermission('admin' as UserRole, 'canManageSettings')).toBe(true);
    });

    it('driver should only have canViewBurials and canManageFleet', () => {
      expect(hasPermission('driver' as UserRole, 'canManageFleet')).toBe(true);
      expect(hasPermission('driver' as UserRole, 'canViewBurials')).toBe(true);
      expect(hasPermission('driver' as UserRole, 'canManageUsers')).toBe(false);
      expect(hasPermission('driver' as UserRole, 'canManageFinancial')).toBe(false);
    });
  });
});
