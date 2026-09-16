'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
export default function Sidebar({ groups, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(groups[0]?.label ?? null);

  const toggle = (label: string) => setOpenGroup((prev) => (prev === label ? null : label));

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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d111a] border-r border-slate-800 overflow-y-auto transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:transform-none`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-sm text-white">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <XIcon />
          </button>
        </div>

        <nav className="py-2">
          {groups.map((g) => {
            const isOpen = openGroup === g.label;
            return (
              <div key={g.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggle(g.label)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span>{g.label}</span>
                  <ChevronIcon open={isOpen} />
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-0.5">
                    {g.items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`block text-xs font-semibold px-4 py-2 rounded transition whitespace-nowrap
                            ${active ? `${item.active} bg-slate-800` : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
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
