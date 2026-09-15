'use client';

import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { authFetch } from '@/lib/authFetch';
import { AppRole, isTabAllowed } from '@/config/permissions';

type NavItem = { href: string; label: string; tab: string; active: string };

// 6f: mapeamento rota -> tab de src/config/permissions.ts. Rotas sem case no
// switch (ordens, crm, audit) caem no default => false, visíveis só
// para superadmin/admin. /fiscal usa "financial": é o gate do monolito
// (activeTab === "fiscal" && isTabAllowed(userRole, "financial")).
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Cadastros',
    items: [
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
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // F-08 fail-closed: sem role confirmado pelo backend a nav nasce vazia
  // (sem flash de links que vao sumir) e nunca inicia como admin.
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadRole = async () => {
      try {
        const res = await authFetch('/api/init-user', { method: 'POST' });
        if (!cancelled && res.ok) {
          const data = (await res.json().catch(() => null)) as { role?: string } | null;
          if (data?.role) setUserRole(data.role as AppRole);
          // Sem role (pendente de aprovacao) => mantem null, nunca default admin.
        }
      } catch {
        // silencioso: nav vazia ate o backend responder
      }
    };
    loadRole();
    return () => {
      cancelled = true;
    };
  }, []);

  // Dropdowns com todos os itens escondidos somem inteiros.
  const visibleGroups = NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter((i) => isTabAllowed(userRole, i.tab)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-900 dark:text-slate-100 font-sans antialiased">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-[#0d111a]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-sm text-slate-900 dark:text-white tracking-wider">
              ETERNITY<span className="text-emerald-400">OS</span>
            </Link>
            <span className="text-[10px] text-slate-600 dark:text-slate-500">ERP Funerário Integrado</span>
          </div>
          <nav className="flex items-center gap-4">
            {visibleGroups.map((g) => (
              <details key={g.label} className="relative">
                <summary className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer list-none">
                  {g.label}
                </summary>
                <div className="absolute top-full left-0 mt-2 bg-[#0d111a] border border-slate-800 rounded-lg p-2 min-w-[140px] shadow-xl z-50 flex flex-col gap-1">
                  {g.items.map((i) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === i.href ? `${i.active} bg-slate-800` : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      {i.label}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <ThemeToggle compact />
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
              ← Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}