'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
            <Link
              href="/planes"
              className={`text-xs font-semibold transition ${pathname === '/planes' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              Planos
            </Link>
            <Link
              href="/vendedores"
              className={`text-xs font-semibold transition ${pathname === '/vendedores' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              Vendedores
            </Link>
            <Link
              href="/crm"
              className={`text-xs font-semibold transition ${pathname === '/crm' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
            >
              CRM
            </Link>
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