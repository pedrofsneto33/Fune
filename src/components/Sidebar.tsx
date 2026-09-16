'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Activity,
  TrendingUp,
  Heart,
  Wallet,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { href: string; label: string; tab: string; active: string };
export type NavGroup = { label: string; items: NavItem[] };

interface SidebarProps {
  groups: NavGroup[];
  open: boolean;
  onClose: () => void;
}

/**
 * Fase 8 — Sidebar vertical de navegação do dashboard.
 *
 * - Recebe `groups` já filtrados por role (sem lógica de permissão aqui).
 * - Desktop (>=lg): sempre fixa/esquerda, `w-64`.
 * - Mobile: drawer animado (translate-x) com overlay escuro; controlado por
 *   `open`/`onClose` (hamburger). `lg:hidden` garante overlay só no mobile.
 * - Primeiro item do primeiro grupo = primeiro link renderizado.
 */
const GROUP_ICONS: Record<string, LucideIcon> = {
  Cadastros: Users,
  Operacional: Activity,
  Comercial: TrendingUp,
  Beneficios: Heart,
  'Benefícios': Heart,
  Financeiro: Wallet,
  Admin: Settings,
};

// Lookup estático: cor do texto ativo (NAV_GROUPS) -> border-l correspondente.
// Classes literais para o Tailwind JIT não purgar.
const ACTIVE_BORDER: Record<string, string> = {
  'text-emerald-400': 'border-l-emerald-400',
  'text-purple-400': 'border-l-purple-400',
  'text-amber-400': 'border-l-amber-400',
  'text-red-400': 'border-l-red-400',
  'text-sky-400': 'border-l-sky-400',
  'text-teal-400': 'border-l-teal-400',
  'text-cyan-400': 'border-l-cyan-400',
  'text-blue-400': 'border-l-blue-400',
  'text-slate-200': 'border-l-slate-200',
};

export default function Sidebar({ groups, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(groups[0]?.label ?? null);

  const toggle = (label: string) => setOpenGroup((prev) => (prev === label ? null : label));

  // Auto-abre o grupo do item ativo na navegação — nunca fecha.
  useEffect(() => {
    const grupoAtivo = groups.find((g) => g.items.some((i) => pathname === i.href));
    if (grupoAtivo && openGroup !== grupoAtivo.label) {
      setOpenGroup(grupoAtivo.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, groups]);

  return (
    <>
      {/* Overlay (mobile only) */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white dark:bg-[#0d111a] border-r border-slate-200 dark:border-slate-800 overflow-y-auto transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
            >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Link href="/executivo" className="font-bold text-sm text-slate-900 dark:text-white tracking-wider">
            ETERNITY<span className="text-emerald-600 dark:text-emerald-400">OS</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors lg:hidden"
            aria-label="Fechar menu"
          >
            <XIcon />
          </button>
        </div>

        <nav className="py-2">
          {groups.map((g) => {
            const isOpen = openGroup === g.label;
            const hasActive = g.items.some((i) => pathname === i.href);
            const GroupIcon = GROUP_ICONS[g.label];
            return (
              <div key={g.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggle(g.label)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${hasActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  {GroupIcon && <GroupIcon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  <span className="flex-1 text-left">{g.label}</span>
                  <ChevronIcon open={isOpen} />
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-0.5">
                    {g.items.map((item) => {
                      const active = pathname === item.href;
                      const border = ACTIVE_BORDER[item.active] ?? 'border-l-slate-400';
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`block text-xs font-semibold pl-4 pr-4 py-2 rounded transition whitespace-nowrap border-l-2 ${
                            active
                              ? `${item.active} bg-slate-100 dark:bg-slate-800 ${border}`
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-l-transparent'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
