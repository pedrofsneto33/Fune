'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isTabAllowed, UserRole } from '@/config/permissions';
import { HeaderQuickSearch } from '@/components/HeaderQuickSearch';

interface KPIState {
  totalLives: number;
  activeContracts: number;
  monthlyRevenue: number;
  overdueAmount: number;
  overdueCount: number;
  burialsThisMonth: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('executive');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [tenantName, setTenantName] = useState<string>('Funerária Matriz');
  const [kpis, setKpis] = useState<KPIState>({
    totalLives: 5,
    activeContracts: 5,
    monthlyRevenue: 409.5,
    overdueAmount: 0,
    overdueCount: 0,
    burialsThisMonth: 0,
  });
  const [isGeneratingBilling, setIsGeneratingBilling] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role, tenant_id, tenants(name)')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (roleData) {
            setUserRole(roleData.role as UserRole);
            if ((roleData as any).tenants?.name) {
              setTenantName((roleData as any).tenants.name);
            }
          }
        }

        const token = session?.access_token || '';
        const res = await fetch('/api/dashboard/kpis', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setKpis((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      }
    }
    loadData();
  }, []);

  const handleGenerateBatchBilling = async () => {
    if (!confirm('Deseja gerar as cobranças e carnês em lote (PIX/Boleto Asaas) para todos os contratos ativos deste mês?')) {
      return;
    }
    setIsGeneratingBilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/generate-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ dueDay: 10 }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(`Sucesso! ${json.message || 'Cobranças geradas.'} (${json.generatedCount || 0} geradas, ${json.skippedCount || 0} ignoradas).`);
      } else {
        alert(`Erro: ${json.error || 'Falha ao gerar cobranças'}`);
      }
    } catch (e) {
      alert('Erro de conexão ao processar cobranças.');
    } finally {
      setIsGeneratingBilling(false);
    }
  };

  const navItems = [
    { id: 'executive', label: 'Painel Executivo', icon: '📊', category: 'GESTÃO & FINANÇAS' },
    { id: 'contracts', label: 'Associados & Contratos', icon: '👥', badge: kpis.activeContracts, category: 'GESTÃO & FINANÇAS' },
    { id: 'burials', label: 'Plantão 24h & Óbitos', icon: '🚨', badge: 0, category: 'OPERAÇÕES & PLANTÃO' },
    { id: 'chapel', label: 'Capelas & Sepultamentos', icon: '⛪', category: 'OPERAÇÕES & PLANTÃO' },
    { id: 'thanatopraxy', label: 'Tanatopraxia', icon: '🔬', category: 'OPERAÇÕES & PLANTÃO' },
    { id: 'inventory', label: 'Estoque & Urnas', icon: '📦', badge: 21, category: 'LOGÍSTICA & SUPORTE' },
    { id: 'fleet', label: 'Frota & Logística', icon: '🚐', badge: 3, category: 'LOGÍSTICA & SUPORTE' },
    { id: 'benefits', label: 'Convênios & Benefícios', icon: '🤝', category: 'LOGÍSTICA & SUPORTE' },
  ];

  const categories = Array.from(new Set(navItems.map((n) => n.category)));

  return (
    <div className="flex h-screen bg-[#07090e] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-[#0d111a] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              ⚡
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wider text-white">ETERNITY OS</h1>
              <p className="text-[10px] text-slate-400">v2.4 Enterprise ERP</p>
            </div>
          </div>

          {/* Seletor de Empresa Ativa */}
          <div className="p-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-emerald-400 text-sm">🏢</span>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{tenantName}</p>
                  <p className="text-[10px] text-slate-400">Empresa Ativa</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">▼</span>
            </div>
          </div>

          {/* Navegação por Categorias */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  {cat}
                </p>
                {navItems
                  .filter((item) => item.category === cat && isTabAllowed(userRole, item.id))
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === item.id
                          ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Rodapé do Usuário */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500 text-blue-400 text-xs font-bold flex items-center justify-center">
              AD
            </div>
            <div>
              <p className="text-xs font-semibold text-white capitalize">{userRole}</p>
              <p className="text-[10px] text-emerald-400">● Operador Ativo</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="text-slate-400 hover:text-rose-400 text-xs"
            title="Sair"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#090d16]">
        {/* Header Superior */}
        <header className="p-4 border-b border-slate-800 bg-[#0d111a]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              {activeTab === 'executive' ? 'PAINEL EXECUTIVO & INDICADORES ESTRATÉGICOS' : activeTab.toUpperCase()}
            </h2>
            <p className="text-xs text-slate-400">Visão operacional e financeira em tempo real</p>
          </div>

          {/* Barra de Busca de Óbito Integrada */}
          <div className="flex-1 max-w-md mx-2">
            <HeaderQuickSearch />
          </div>

          {/* Botões de Ação Operacional */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateBatchBilling}
              disabled={isGeneratingBilling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
              title="Gerar carnês e PIX no Asaas para contratos ativos"
            >
              <span>📄</span>
              {isGeneratingBilling ? 'Gerando...' : 'Carnês em Lote'}
            </button>

            <button
              onClick={() => alert('Abrindo acionamento de plantão de emergência 24h')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-md shadow-rose-950"
            >
              <span>🚨</span>
              Acionamento 24h
            </button>

            <button
              onClick={() => alert('Abrir cadastro de novo associado/titular')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md shadow-emerald-950"
            >
              <span>+</span>
              Novo Titular
            </button>
          </div>
        </header>

        {/* Corpo da Aba Selecionada */}
        <div className="p-6 space-y-6 flex-1">
          {activeTab === 'executive' && (
            <>
              {/* 4 Cards de Indicadores KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                    <span>MRR Recorrente</span>
                    <span className="text-emerald-400 text-sm">$</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-white">
                      {kpis.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Receita Mensal Prevista</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                    <span>Associados Ativos</span>
                    <span className="text-blue-400 text-sm">👥</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{kpis.activeContracts}</span>
                    <span className="text-xs text-slate-400">({kpis.totalLives} vidas)</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">Contratos na base</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                    <span>Missões em Aberto</span>
                    <span className="text-rose-400 text-sm">🚨</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-white">{kpis.burialsThisMonth}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Plantão em atendimento</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                    <span>Veículos Disponíveis</span>
                    <span className="text-amber-400 text-sm">🚐</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Total de 3 veículos</p>
                </div>
              </div>

              {/* Gráfico de Previsibilidade Financeira */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Fluxo de Receita Recorrente & Previsibilidade
                  </h3>
                  <span className="text-xs text-emerald-400 font-semibold">● 100% Sincronizado</span>
                </div>
                <div className="h-48 w-full bg-slate-950/50 rounded-lg flex items-end justify-between p-4 border border-slate-800/50">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, idx) => {
                    const heights = ['h-24', 'h-28', 'h-32', 'h-30', 'h-36', 'h-40'];
                    return (
                      <div key={month} className="flex flex-col items-center gap-2 flex-1">
                        <div className={`w-12 bg-gradient-to-t from-emerald-600/30 to-emerald-500/80 rounded-t ${heights[idx]} transition-all`} />
                        <span className="text-[10px] text-slate-400 font-semibold">{month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab !== 'executive' && (
            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-xl text-center">
              <h3 className="text-lg font-bold text-white mb-2">Módulo {activeTab.toUpperCase()}</h3>
              <p className="text-xs text-slate-400">Carregando dados com isolamento multi-tenant ativo.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
