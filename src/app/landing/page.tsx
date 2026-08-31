'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-zinc-100 font-sans">
      <header className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <span className="text-blue-400 font-bold text-sm">E</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Eternity<span className="text-blue-400">OS</span>
          </h1>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="text-zinc-400 hover:text-zinc-200 transition">Recursos</a>
          <a href="#pricing" className="text-zinc-400 hover:text-zinc-200 transition">Planos</a>
          <a href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-600/20">
            Acessar Sistema
          </a>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          ERP Funerário <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Inteligente</span> e Integrado
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
          Gestão completa para empresas funerárias: planos de saúde funerários, cobranças, logística de frota,
          capelas, tanatopraxia e muito mais — tudo em uma única plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-600/20"
          >
            Começar Agora
          </a>
        </div>
      </main>

      <section id="features" className="container mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold text-center mb-12">Módulos do Sistema</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-3">🏢</div>
            <h4 className="font-bold text-white mb-2">Gestão de Titulares</h4>
            <p className="text-sm text-zinc-400">Controle de associados, dependentes e contratos de planos funerários.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-3">💳</div>
            <h4 className="font-bold text-white mb-2">Cobranças & Pagamentos</h4>
            <p className="text-sm text-zinc-400">Integração com Asaas para PIX, boleto e carnês. Geração automática de ciclos.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-3">🚚</div>
            <h4 className="font-bold text-white mb-2">Frota & Logística</h4>
            <p className="text-sm text-zinc-400">Controle de veículos, motoristas e plantões de atendimento 24h.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-3">⚰️</div>
            <h4 className="font-bold text-white mb-2">Capelas & Tanatopraxia</h4>
            <p className="text-sm text-zinc-400">Agendamento de velórios, capelas e controle de preparação de corpos.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="font-bold text-white mb-2">BI & Financeiro</h4>
            <p className="text-sm text-zinc-400">Dashboard de KPIs, DRE, reservas regulatórias e contas a pagar.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-3xl mb-3">🔐</div>
            <h4 className="font-bold text-white mb-2">Controle de Acesso RBAC</h4>
            <p className="text-sm text-zinc-400">Permissões granulares por perfil: superadmin, admin, manager, attendant, driver, financial.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 mt-16">
        <div className="container mx-auto px-6 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} EternityOS — Sistema de Gestão Funerária e Planos de Assistência</p>
        </div>
      </footer>
    </div>
  );
}

