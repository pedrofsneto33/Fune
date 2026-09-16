'use client';

import Link from 'next/link';
import {
  Users,
  ClipboardList,
  DollarSign,
  Church,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { AppRole, isTabAllowed } from '@/config/permissions';

type QuickLinkItem = {
  href: string;
  label: string;
  desc: string;
  tab: string;
  icon: LucideIcon;
  iconColor: string;
  hoverBorder: string;
};

const LINKS: QuickLinkItem[] = [
  { href: '/titulares', label: 'Titulares', desc: 'Gestão de associados', tab: 'holders', icon: Users, iconColor: 'text-emerald-400', hoverBorder: 'hover:border-emerald-400' },
  { href: '/ordens', label: 'Ordens', desc: 'Chamados de plantão 24h', tab: 'orders', icon: ClipboardList, iconColor: 'text-red-400', hoverBorder: 'hover:border-red-400' },
  { href: '/financeiro', label: 'Financeiro', desc: 'Cobranças e conciliação', tab: 'financial', icon: DollarSign, iconColor: 'text-green-500', hoverBorder: 'hover:border-green-500' },
  { href: '/capela', label: 'Capela', desc: 'Reservas e velórios', tab: 'chapel', icon: Church, iconColor: 'text-amber-400', hoverBorder: 'hover:border-amber-400' },
  { href: '/contratos', label: 'Contratos', desc: 'Ativos e elegibilidade', tab: 'holders', icon: FileText, iconColor: 'text-teal-400', hoverBorder: 'hover:border-teal-400' },
  { href: '/auditoria', label: 'Auditoria', desc: 'Log de ações e eventos', tab: 'audit', icon: ShieldCheck, iconColor: 'text-slate-300', hoverBorder: 'hover:border-slate-300' },
];

export default function QuickLinks({ role }: { role: AppRole | null }) {
  const visible = LINKS.filter((l) => isTabAllowed(role, l.tab));
  if (visible.length === 0) return null;

  return (
    <section aria-label="Atalhos rápidos">
      <h2 className="text-sm font-bold text-white mb-3">Atalhos rápidos</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {visible.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={'bg-[#0d111a] border border-slate-800 rounded-lg p-4 transition-colors group ' + l.hoverBorder}
            >
              <Icon className={'w-5 h-5 ' + l.iconColor} aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-white">{l.label}</p>
              <p className="text-[11px] text-slate-500">{l.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
