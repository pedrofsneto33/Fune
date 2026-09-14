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
            <details className="relative">
              <summary className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer list-none">
                Cadastros
              </summary>
              <div className="absolute top-full left-0 mt-2 bg-[#0d111a] border border-slate-800 rounded-lg p-2 min-w-[140px] shadow-xl z-50 flex flex-col gap-1">
                <Link href="/titulares" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/titulares' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Titulares</Link>
                <Link href="/dependentes" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/dependentes' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Dependentes</Link>
                <Link href="/contratos" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/contratos' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Contratos</Link>
                <Link href="/frota" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/frota' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Frota</Link>
                <Link href="/estoque" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/estoque' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Estoque</Link>
              </div>
            </details>
            <details className="relative">
              <summary className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer list-none">
                Operacional
              </summary>
              <div className="absolute top-full left-0 mt-2 bg-[#0d111a] border border-slate-800 rounded-lg p-2 min-w-[160px] shadow-xl z-50 flex flex-col gap-1">
                <Link href="/tanatopraxia" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/tanatopraxia' ? 'text-purple-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Tanatopraxia</Link>
                <Link href="/capela" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/capela' ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Capela</Link>
                <Link href="/ordens" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/ordens' ? 'text-red-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Ordens de Serviço</Link>
                <Link href="/sepultamentos" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/sepultamentos' ? 'text-sky-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Sepultamentos</Link>
              </div>
            </details>
            <details className="relative">
              <summary className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer list-none">
                Comercial
              </summary>
              <div className="absolute top-full left-0 mt-2 bg-[#0d111a] border border-slate-800 rounded-lg p-2 min-w-[140px] shadow-xl z-50 flex flex-col gap-1">
                <Link href="/planes" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/planes' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Planos</Link>
                <Link href="/vendedores" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/vendedores' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Vendedores</Link>
                <Link href="/crm" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/crm' ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>CRM</Link>
              </div>
            </details>
            <details className="relative">
              <summary className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer list-none">
                Benefícios
              </summary>
              <div className="absolute top-full left-0 mt-2 bg-[#0d111a] border border-slate-800 rounded-lg p-2 min-w-[160px] shadow-xl z-50 flex flex-col gap-1">
                <Link href="/beneficios" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/beneficios' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Benefícios</Link>
                <Link href="/convalescencia" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/convalescencia' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Convalescência</Link>
              </div>
            </details>
            <details className="relative">
              <summary className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer list-none">
                Financeiro
              </summary>
              <div className="absolute top-full left-0 mt-2 bg-[#0d111a] border border-slate-800 rounded-lg p-2 min-w-[160px] shadow-xl z-50 flex flex-col gap-1">
                <Link href="/fiscal" className={`text-xs font-semibold px-3 py-1.5 rounded transition ${pathname === '/fiscal' ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Fiscal (NFS-e)</Link>
              </div>
            </details>
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