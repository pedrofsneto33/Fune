'use client';

import Link from 'next/link';
import { AppRole, isTabAllowed } from '@/config/permissions';

type QuickLinkItem = {
  href: string;
  label: string;
  tab: string;
  icon: string;
  desc: string;
};

const LINKS: QuickLinkItem[] = [
  { href: '/titulares', label: 'Titulares', tab: 'holders', icon: '👥', desc: 'Cadastro de titulares' },
  { href: '/ordens', label: 'Ordens', tab: 'orders', icon: '📋', desc: 'Ordens de serviço' },
  { href: '/financeiro', label: 'Financeiro', tab: 'financial', icon: '💰', desc: 'Cobranças e caixa' },
  { href: '/capela', label: 'Capela', tab: 'chapel', icon: '🕊️', desc: 'Velórios e capela' },
  { href: '/contratos', label: 'Contratos', tab: 'holders', icon: '📄', desc: 'Contratos ativos' },
  { href: '/auditoria', label: 'Auditoria', tab: 'audit', icon: '🔍', desc: 'Trilha de auditoria' },
];

export default function QuickLinks({ role }: { role: AppRole | null }) {
  const visible = LINKS.filter((l) => isTabAllowed(role, l.tab));
  if (visible.length === 0) return null;

  return (
    <section aria-label="Atalhos rápidos">
      <h2 className="text-sm font-bold text-white mb-3">Atalhos rápidos</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {visible.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="bg-[#0d111a] border border-slate-800 hover:border-emerald-600 rounded-lg p-4 transition-colors group"
          >
            <span className="text-xl" aria-hidden="true">
              {l.icon}
            </span>
            <p className="mt-2 text-sm font-bold text-white group-hover:text-emerald-400">
              {l.label}
            </p>
            <p className="text-[11px] text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
