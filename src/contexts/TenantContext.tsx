'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Tenant {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  phone_emergency: string;
  municipal_license_number?: string;
  issuance_city?: string;
  technical_manager?: string;
  status: string;
}

interface TenantContextType {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  loading: boolean;
  setCurrentTenant: (tenant: Tenant) => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenants: [],
  currentTenant: null,
  loading: true,
  setCurrentTenant: () => {},
  refreshTenants: async () => {},
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const json = await res.json();
      if (json.success && json.tenants?.length > 0) {
        setTenants(json.tenants);

        const savedTenantId = typeof window !== 'undefined' ? localStorage.getItem('eternity_tenant_id') : null;
        const matched = json.tenants.find((t: Tenant) => t.id === savedTenantId);
        
        if (matched) {
          setCurrentTenantState(matched);
        } else {
          setCurrentTenantState(json.tenants[0]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('eternity_tenant_id', json.tenants[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Falha ao carregar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const setCurrentTenant = (tenant: Tenant) => {
    setCurrentTenantState(tenant);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eternity_tenant_id', tenant.id);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        currentTenant,
        loading,
        setCurrentTenant,
        refreshTenants: fetchTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}