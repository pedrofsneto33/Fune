'use client';

// Fase 9a (opcao b): home unificada dentro de (dashboard) — mesma URL `/`,
// herda Sidebar + header compacto do layout. Quem tem acesso a `executive`
// ve KPIs + atalhos inline; quem nao tem cai no redirect para a primeira
// rota permitida (mesma logica do HomeRedirect antigo).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { AppRole, isTabAllowed } from '@/config/permissions';
import { NAV_GROUPS } from './layout';
import ExecutiveTab from '@/components/tabs/ExecutiveTab';
import QuickLinks from '@/components/QuickLinks';
import RecentActivity from '@/components/RecentActivity';

export default function DashboardHomePage() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await authFetch('/api/init-user', { method: 'POST' });
        const data = await res.json().catch(() => null);
        const r = (data?.role ?? null) as AppRole | null;
        if (cancel) return;
        if (!res.ok || !r) {
          router.replace('/login');
          return;
        }
        setRole(r);
        if (!isTabAllowed(r, 'executive')) {
          for (const group of NAV_GROUPS) {
            for (const item of group.items) {
              if (isTabAllowed(r, item.tab)) {
                router.replace(item.href);
                return;
              }
            }
          }
          router.replace('/titulares');
          return;
        }
        setReady(true);
      } catch {
        if (!cancel) router.replace('/login');
      }
    })();
    return () => {
      cancel = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400 text-sm">Carregando painel…</p>
      </div>
    );
  }

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-white">Bem-vindo</h1>
        <p className="text-xs text-slate-400 capitalize">{hoje}</p>
        <p className="text-xs text-slate-500">Painel executivo</p>
      </header>
      <ExecutiveTab />
      <QuickLinks role={role} />
      <RecentActivity role={role} />
    </div>
  );
}
