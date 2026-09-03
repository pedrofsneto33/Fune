'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/config/permissions';

interface AuthState {
  session: any;
  userRole: UserRole;
  tenantName: string;
  authChecking: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    userRole: 'admin',
    tenantName: 'Funerária Matriz',
    authChecking: true,
  });

  const loadUserRole = useCallback(async (session: any) => {
    if (!session) {
      setState(prev => ({ ...prev, authChecking: false }));
      return;
    }

    try {
      const res = await fetch('/api/init-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      
      setState(prev => ({
        ...prev,
        userRole: (data.role as UserRole) || 'admin',
        authChecking: false,
      }));
    } catch {
      setState(prev => ({ ...prev, authChecking: false }));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setState(prev => ({ ...prev, session: initialSession }));
      loadUserRole(initialSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setState(prev => ({ ...prev, session: newSession }));
      if (newSession) loadUserRole(newSession);
    });

    return () => subscription.unsubscribe();
  }, [loadUserRole]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      session: null,
      userRole: 'admin',
      tenantName: 'Funerária Matriz',
      authChecking: false,
    });
  }, []);

  return {
    ...state,
    logout,
    setUserRole: (role: UserRole) => setState(prev => ({ ...prev, userRole: role })),
    setTenantName: (name: string) => setState(prev => ({ ...prev, tenantName: name })),
  };
}
