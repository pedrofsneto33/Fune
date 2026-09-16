'use client';

import { useCallback, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import PendingApprovalScreen from '@/components/PendingApprovalScreen';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { AppRole, isTabAllowed } from '@/config/permissions';


type NavItem = { href: string; label: string; tab: string; active: string };

export type { NavItem };

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Cadastros',
        items: [
      { href: '/executivo', label: 'Dashboard', tab: 'executive', active: 'text-emerald-400' },
      { href: '/titulares', label: 'Titulares', tab: 'holders', active: 'text-emerald-400' },
      { href: '/dependentes', label: 'Dependentes', tab: 'holders', active: 'text-emerald-400' },
      { href: '/contratos', label: 'Contratos', tab: 'holders', active: 'text-emerald-400' },
      { href: '/frota', label: 'Frota', tab: 'fleet', active: 'text-emerald-400' },
      { href: '/estoque', label: 'Estoque', tab: 'inventory', active: 'text-emerald-400' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { href: '/tanatopraxia', label: 'Tanatopraxia', tab: 'thanatopraxy', active: 'text-purple-400' },
      { href: '/capela', label: 'Capela', tab: 'chapel', active: 'text-amber-400' },
      { href: '/ordens', label: 'Ordens de Serviço', tab: 'orders', active: 'text-red-400' },
      { href: '/sepultamentos', label: 'Sepultamentos', tab: 'burials', active: 'text-sky-400' },
      { href: '/logistica', label: 'Logística', tab: 'fleet', active: 'text-teal-400' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/planes', label: 'Planos', tab: 'plans', active: 'text-cyan-400' },
      { href: '/vendedores', label: 'Vendedores', tab: 'sellers', active: 'text-cyan-400' },
      { href: '/crm', label: 'CRM', tab: 'crm', active: 'text-amber-400' },
    ],
  },
  {
    label: 'Benefícios',
    items: [
      { href: '/beneficios', label: 'Benefícios', tab: 'benefits', active: 'text-cyan-400' },
      { href: '/convalescencia', label: 'Convalescência', tab: 'convalescence', active: 'text-cyan-400' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/fiscal', label: 'Fiscal (NFS-e)', tab: 'financial', active: 'text-blue-400' },
      { href: '/financeiro', label: 'Cobranças', tab: 'financial', active: 'text-emerald-400' },
      { href: '/livro-caixa', label: 'Livro Caixa', tab: 'financial', active: 'text-emerald-400' },
      { href: '/contas-a-pagar', label: 'Contas a Pagar', tab: 'financial', active: 'text-emerald-400' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/auditoria', label: 'Auditoria', tab: 'audit', active: 'text-slate-200' },
      { href: '/usuarios', label: 'Usuários', tab: 'users', active: 'text-slate-200' },
      { href: '/configuracoes', label: 'Configurações', tab: 'settings', active: 'text-slate-200' },
    ],
  },
];

type AuthState = 'loading' | 'pending' | 'error' | 'authenticated';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');



  const handleSignOut = async () => {
    if (!window.confirm('Sair da conta?')) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setSigningOut(false);
    }
  };

  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  const loadRole = useCallback(async (signal: { cancelled: boolean }) => {
    setAuthState('loading');
    setUserRole(null);
    try {
      const res = await authFetch('/api/init-user', { method: 'POST' });
      if (signal.cancelled) return;
      const data = (await res.json().catch(() => null)) as
        | { role?: string; code?: string }
        | null;
      if (data?.role) {
        setUserRole(data.role as AppRole);
        setAuthState('authenticated');
        return;
      }
      setAuthState(data?.code === 'PENDING_APPROVAL' ? 'pending' : 'error');
    } catch {
      if (signal.cancelled) return;
      setAuthState('error');
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    loadRole(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadRole]);

  const visibleGroups = NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter((i) => isTabAllowed(userRole, i.tab)),
  })).filter((g) => g.items.length > 0);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs font-mono animate-pulse">
        Verificando credenciais e permissões de acesso...
      </div>
    );
  }

  if (authState === 'pending') return <PendingApprovalScreen />;

  if (authState === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Não foi possível confirmar seu acesso
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Falha ao consultar suas permissões. Verifique sua conexão e tente
            novamente.
          </p>
          <button
            onClick={() => loadRole({ cancelled: false })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex">
      {/* Sidebar: fixa desktop, drawer mobile */}
      <Sidebar
        groups={visibleGroups}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteudo principal */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header compacto */}
        <header className="border-b border-slate-800 bg-[#0d111a] sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Hamburger mobile */}
              {!isDesktop && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-slate-400 hover:text-white lg:hidden"
                  aria-label="Abrir menu"
                >
                  ☰
                </button>
              )}
              <span className="text-xs text-slate-500">
                ERP Funerário Integrado
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle compact />
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-slate-400 hover:text-red-400 text-xs transition disabled:opacity-50"
              >
                {signingOut ? 'Saindo...' : '🚪 Sair'}
              </button>
            </div>
          </div>
        </header>

        {/* Conteudo da pagina */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}