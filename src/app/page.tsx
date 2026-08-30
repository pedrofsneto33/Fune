'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { ModalRBAC } from '@/components/dashboard/ModalRBAC';
import { ModalDRE } from '@/components/dashboard/ModalDRE';

interface Dependent {
  id: string;
  full_name: string;
  relation: string;
}

interface Contract {
  id: string;
  status: string;
  start_date: string;
  plans?: { id: string; name: string; monthly_fee: number };
}

interface Holder {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
  contracts?: Contract[];
  dependents?: Dependent[];
}

interface Burial {
  id: string;
  deceased_name: string;
  burial_date: string;
  cemetery_location?: string;
  status: string;
}

export default function CompleteEternityERP() {
  const [activeTab, setActiveTab] = useState<
    'executive' | 'holders' | 'burials' | 'thanatopraxy' | 'chapel' | 'fleet' | 'inventory' | 'convalescence' | 'benefits' | 'financial'
  >('holders');

  const [tenantName, setTenantName] = useState<string>('Funerária Matriz');
  const [holders, setHolders] = useState<Holder[]>([]);
  const [burials, setBurials] = useState<Burial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'defaulted'>('all');

  // Modais
  const [isNewHolderOpen, setIsNewHolderOpen] = useState(false);
  const [isNewBurialOpen, setIsNewBurialOpen] = useState(false);
  const [isDREOpen, setIsDREOpen] = useState(false);
  const [isRBACOpen, setIsRBACOpen] = useState(false);
  const [selectedHolder, setSelectedHolder] = useState<Holder | null>(null);

  // Forms
  const [holderForm, setHolderForm] = useState({ full_name: '', cpf: '', phone: '', email: '', address: '', plan_name: 'Familiar Ouro', monthly_fee: 69.90 });
  const [savingHolder, setSavingHolder] = useState(false);

  const [burialForm, setBurialForm] = useState({ deceased_name: '', cemetery_location: '', burial_date: '' });
  const [savingBurial, setSavingBurial] = useState(false);

  const [depName, setDepName] = useState('');
  const [depRelation, setDepRelation] = useState('Cônjuge');
  const [savingDep, setSavingDep] = useState(false);

  // Dados dos Módulos Operacionais
  const inventory = [
    { id: '1', item_name: 'Urna Luxo Sextavada Mogno', category: 'Urna Adulto', stock: 8 },
    { id: '2', item_name: 'Urna Standard Envernizada', category: 'Urna Adulto', stock: 12 },
    { id: '3', item_name: 'Urna Infantil Branca com Anjo', category: 'Urna Infantil', stock: 3 },
    { id: '4', item_name: 'Véu de Renda Especial com Flores', category: 'Ornamentação', stock: 25 },
  ];

  const vehicles = [
    { id: '1', plate: 'PI-FUN-2026', model: 'Mercedes-Benz Vito Cortejo', status: 'Disponível', driver: 'Marcos Plantão' },
    { id: '2', plate: 'PI-REM-0099', model: 'Fiat Fiorino Remoção 24h', status: 'Disponível', driver: 'João Silva' },
    { id: '3', plate: 'PI-SUP-4040', model: 'Chevrolet Spin Apoio', status: 'Disponível', driver: 'Disponível' },
  ];

  const convalescence = [
    { id: '1', item: 'Cadeira de Rodas Dobrável', holder: 'Carlos Eduardo Silva', date: '15/08/2026' },
    { id: '2', item: 'Par de Muletas Canadenses', holder: 'Mariana Costa Ferreira', date: '20/08/2026' },
    { id: '3', item: 'Cama Hospitalar Articulada', holder: 'pedro', date: '10/08/2026' },
  ];

  const partners = [
    { id: '1', name: 'Farmácia Pague Menos Teresina', cat: 'Medicamentos & Farmácia', discount: '25% OFF', contact: '(86) 3222-1000' },
    { id: '2', name: 'Clínica Médica São Camilo', cat: 'Consultas & Exames', discount: '30% OFF', contact: '(86) 3215-4000' },
    { id: '3', name: 'Laboratório Central Diagnósticos', cat: 'Exames Laboratoriais', discount: '35% OFF', contact: '(86) 3230-8000' },
    { id: '4', name: 'Óticas Diniz Centro', cat: 'Ótica & Óculos', discount: '20% OFF', contact: '(86) 3221-5500' },
  ];

  const thanatopraxyRecords = [
    { id: '1', deceased_name: 'Severino Bezerra', technician: 'Dr. Roberto Tanatólogo', procedure: 'Aspiração, Formolização e Maquiagem', completed_at: '29/08/2026 18:30' },
  ];

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/holders');
      if (res.ok) {
        const data = await res.json();
        setHolders(Array.isArray(data) ? data : []);
      }
      const bRes = await fetch('/api/chapel/burials');
      if (bRes.ok) {
        const bData = await bRes.json();
        setBurials(Array.isArray(bData) ? bData : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredHolders = useMemo(() => {
    return holders.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        h.full_name?.toLowerCase().includes(q) ||
        h.cpf?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        h.phone?.includes(q);

      const status = h.contracts?.[0]?.status || 'active';
      const matchS = statusFilter === 'all' || status === statusFilter;

      return matchQ && matchS;
    });
  }, [holders, searchQuery, statusFilter]);

  const handleSaveHolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHolder(true);
    try {
      const res = await fetch('/api/holders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holderForm),
      });

      if (res.ok) {
        setIsNewHolderOpen(false);
        setHolderForm({ full_name: '', cpf: '', phone: '', email: '', address: '', plan_name: 'Familiar Ouro', monthly_fee: 69.90 });
        await loadData();
        alert('Associado cadastrado com sucesso!');
      } else {
        const j = await res.json();
        alert(`Erro: ${j.error || 'Verifique os dados'}`);
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setSavingHolder(false);
    }
  };

  const handleSaveBurial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBurial(true);
    try {
      const res = await fetch('/api/chapel/burials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(burialForm),
      });

      if (res.ok) {
        setIsNewBurialOpen(false);
        setBurialForm({ deceased_name: '', cemetery_location: '', burial_date: '' });
        await loadData();
        alert('Chamado de plantão registrado!');
      } else {
        const j = await res.json();
        alert(`Erro: ${j.error}`);
      }
    } catch {
      alert('Erro ao registrar.');
    } finally {
      setSavingBurial(false);
    }
  };

  const handleAddDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolder || !depName) return;
    setSavingDep(true);
    try {
      const { data, error } = await supabase
        .from('dependents')
        .insert([{
          holder_id: selectedHolder.id,
          full_name: depName,
          relation: depRelation,
        }])
        .select()
        .single();

      if (!error && data) {
        setDepName('');
        setSelectedHolder((prev) => prev ? { ...prev, dependents: [...(prev.dependents || []), data] } : null);
        await loadData();
      }
    } finally {
      setSavingDep(false);
    }
  };

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex h-screen bg-[#07090e] text-slate-100 font-sans overflow-hidden antialiased">
      {/* SIDEBAR COMPLETA COM OS 10 MÓDULOS */}
      <aside className="w-64 bg-[#0d111a] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-base shadow">
              ✦
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wider">ETERNITY<span className="text-emerald-400">OS</span></h1>
              <p className="text-[10px] text-slate-400">v2.4 Enterprise ERP</p>
            </div>
          </div>

          <div className="p-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-emerald-400 text-xs">🏢</span>
                <p className="text-xs font-semibold text-white truncate">{tenantName}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>

          <nav className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">GESTÃO & FINANÇAS</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('executive')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'executive' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>📊</span> Painel Executivo</div>
                </button>
                <button
                  onClick={() => setActiveTab('holders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'holders' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>👥</span> Associados & Contratos</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{holders.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'financial' ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>💰</span> Financeiro & DRE</div>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">OPERAÇÕES & PLANTÃO</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('burials')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'burials' ? 'bg-rose-600/15 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>🚨</span> Plantão 24h & Óbitos</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">{burials.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('thanatopraxy')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'thanatopraxy' ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>🔬</span> Tanatopraxia</div>
                </button>
                <button
                  onClick={() => setActiveTab('chapel')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'chapel' ? 'bg-amber-600/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>⛪</span> Capelas & Velórios</div>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">LOGÍSTICA & SUPORTE</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('fleet')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'fleet' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>🚐</span> Frota & Veículos</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{vehicles.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'inventory' ? 'bg-amber-600/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>📦</span> Estoque & Urnas</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{inventory.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('convalescence')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'convalescence' ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>♿</span> Convalescença (Apoio)</div>
                </button>
                <button
                  onClick={() => setActiveTab('benefits')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'benefits' ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2"><span>🤝</span> Clube de Convênios</div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">AD</div>
            <div>
              <p className="text-xs font-semibold text-white">Administrador</p>
              <p className="text-[10px] text-emerald-400">● Operador Ativo</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsDREOpen(true)} className="p-1 text-xs text-slate-400 hover:text-emerald-400" title="Ver DRE">📈</button>
            <button onClick={() => setIsRBACOpen(true)} className="p-1 text-xs text-slate-400 hover:text-blue-400" title="Permissões">🛡️</button>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#070a11]">
        <header className="p-4 border-b border-slate-800 bg-[#0d111a] flex items-center justify-between gap-4 shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {activeTab === 'executive' && 'Painel Executivo'}
            {activeTab === 'holders' && 'Gestão de Associados & Planos'}
            {activeTab === 'burials' && 'Central de Plantão 24h & Óbitos'}
            {activeTab === 'thanatopraxy' && 'Laboratório de Tanatopraxia'}
            {activeTab === 'chapel' && 'Capelas & Velórios'}
            {activeTab === 'fleet' && 'Frota & Veículos'}
            {activeTab === 'inventory' && 'Estoque de Urnas'}
            {activeTab === 'convalescence' && 'Aparelhos Convalescentes'}
            {activeTab === 'benefits' && 'Clube de Convênios'}
            {activeTab === 'financial' && 'Gestão Financeira & DRE'}
          </h2>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNewBurialOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow"
            >
              <span>🚨</span> Novo Atendimento / Óbito
            </button>
            <button
              onClick={() => setIsNewHolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow"
            >
              <span>+</span> Novo Titular
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. PAINEL EXECUTIVO */}
          {activeTab === 'executive' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">MRR Recorrente</p>
                  <p className="text-2xl font-bold text-white mt-2">{fmtBRL(holders.length * 69.90)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Receita Mensal Prevista</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Associados Ativos</p>
                  <p className="text-2xl font-bold text-white mt-2">{holders.length}</p>
                  <p className="text-[11px] text-emerald-400 mt-1">Contratos na base</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Missões em Aberto</p>
                  <p className="text-2xl font-bold text-white mt-2">{burials.length}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Plantão em atendimento</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Veículos Disponíveis</p>
                  <p className="text-2xl font-bold text-white mt-2">{vehicles.length}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Total de 3 veículos</p>
                </div>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Ações Rápidas de Gestão</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => setActiveTab('holders')} className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-left transition">
                    <p className="font-bold text-sm text-white">👥 Gerenciar Associados</p>
                    <p className="text-xs text-slate-400 mt-1">Cobrar por WhatsApp, emitir carteirinhas e dependentes</p>
                  </button>
                  <button onClick={() => setActiveTab('burials')} className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-left transition">
                    <p className="font-bold text-sm text-rose-400">🚨 Central de Plantão 24h</p>
                    <p className="text-xs text-slate-400 mt-1">Atendimento imediato e ordens de serviço de óbito</p>
                  </button>
                  <button onClick={() => setIsDREOpen(true)} className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-left transition">
                    <p className="font-bold text-sm text-emerald-400">📈 Demonstrativo DRE</p>
                    <p className="text-xs text-slate-400 mt-1">Conferência de receitas, despesas e margem líquida</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. ASSOCIADOS */}
          {activeTab === 'holders' && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex-1 min-w-[280px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar por Nome do Titular, CPF ou WhatsApp..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1 rounded ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}>Todos ({holders.length})</button>
                  <button onClick={() => setStatusFilter('active')} className={`px-2.5 py-1 rounded ${statusFilter === 'active' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-400'}`}>Ativos</button>
                  <button onClick={() => setStatusFilter('defaulted')} className={`px-2.5 py-1 rounded ${statusFilter === 'defaulted' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400'}`}>Inadimplentes</button>
                </div>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-3 px-4">Titular</th>
                      <th className="py-3 px-4">CPF</th>
                      <th className="py-3 px-4">Telefone</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredHolders.map((h) => {
                      const contract = h.contracts?.[0];
                      const status = contract?.status || 'active';
                      const planName = contract?.plans?.name || 'Familiar Ouro';
                      const rawCpf = h.cpf?.replace(/\D/g, '') || '';
                      const waUrl = formatWhatsAppMessage({ holderName: h.full_name, phone: h.phone, planName, amount: 69.90, dueDate: '10/09', cpf: h.cpf });

                      return (
                        <tr key={h.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white">{h.full_name} <span className="block text-[10px] text-slate-500 font-normal">({h.dependents?.length || 0} dependentes)</span></td>
                          <td className="py-3 px-4 font-mono text-slate-300">{h.cpf}</td>
                          <td className="py-3 px-4 text-slate-300">{h.phone}</td>
                          <td className="py-3 px-4 text-blue-400 font-semibold">{planName}</td>
                          <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">{status === 'active' ? '● Ativo' : status}</span></td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <a href={waUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded text-[11px] font-bold">💬 Cobrar</a>
                              <a href={`/carteirinha/${rawCpf}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700">🪪 Carteirinha</a>
                              <button onClick={() => setSelectedHolder(h)} className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded text-[11px]">👥 Dependentes</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PLANTÃO 24H */}
          {activeTab === 'burials' && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <tr><th className="py-3 px-4">Falecido</th><th className="py-3 px-4">Local</th><th className="py-3 px-4">Data/Hora</th><th className="py-3 px-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {burials.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{b.deceased_name}</td>
                        <td className="py-3 px-4 text-slate-300">{b.cemetery_location || 'Em traslado'}</td>
                        <td className="py-3 px-4 font-mono">{new Date(b.burial_date).toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">{b.status || 'Agendado'}</span></td>
                      </tr>
                    ))}
                    {burials.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">Nenhum chamado no momento.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TANATOPRAXIA */}
          {activeTab === 'thanatopraxy' && (
            <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-white text-sm mb-3">Laboratório de Tanatopraxia</h3>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-white text-sm">Severino Bezerra</p>
                  <p className="text-xs text-slate-400">Técnico: Dr. Roberto Tanatólogo • Aspiração e Formolização</p>
                </div>
                <span className="text-xs text-emerald-400 font-bold">✓ Concluído</span>
              </div>
            </div>
          )}

          {/* 5. CAPELAS */}
          {activeTab === 'chapel' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase"><span>Capela 01</span><span className="text-emerald-400">● Livre</span></div>
                <p className="text-sm font-bold text-white mt-2">Capela Master com Suíte</p>
              </div>
              <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase"><span>Capela 02</span><span className="text-rose-400">● Ocupada</span></div>
                <p className="text-sm font-bold text-white mt-2">Velório em Andamento</p>
              </div>
              <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase"><span>Capela 03</span><span className="text-emerald-400">● Livre</span></div>
                <p className="text-sm font-bold text-white mt-2">Capela Standard</p>
              </div>
            </div>
          )}

          {/* 6. FROTA */}
          {activeTab === 'fleet' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-bold"><span>{v.plate}</span><span className="text-emerald-400">● {v.status}</span></div>
                  <h4 className="font-bold text-white text-sm mt-2">{v.model}</h4>
                  <p className="text-xs text-slate-400 mt-1">Motorista: {v.driver}</p>
                </div>
              ))}
            </div>
          )}

          {/* 7. ESTOQUE */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((item) => (
                <div key={item.id} className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</p>
                  <h4 className="font-bold text-white text-sm mt-1">{item.item_name}</h4>
                  <p className="text-2xl font-bold text-slate-100 mt-3">{item.stock} un</p>
                </div>
              ))}
            </div>
          )}

          {/* 8. CONVALESCENÇA */}
          {activeTab === 'convalescence' && (
            <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <tr><th className="py-3 px-4">Equipamento</th><th className="py-3 px-4">Associado</th><th className="py-3 px-4">Data Empréstimo</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {convalescence.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-emerald-400">{c.item}</td>
                      <td className="py-3 px-4">{c.holder}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{c.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 9. CONVÊNIOS */}
          {activeTab === 'benefits' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {partners.map((p) => (
                <div key={p.id} className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">{p.cat}</span>
                    <h4 className="font-bold text-white text-sm mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">Contato: {p.contact}</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">{p.discount}</span>
                </div>
              ))}
            </div>
          )}

          {/* 10. FINANCEIRO */}
          {activeTab === 'financial' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                <p className="text-xs font-semibold text-slate-400 uppercase">Receita Mensal de Planos</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{fmtBRL(holders.length * 69.90)}</p>
              </div>
              <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                <p className="text-xs font-semibold text-slate-400 uppercase">Reserva Técnica Obrigatória (15%)</p>
                <p className="text-xl font-bold text-blue-400 mt-1">{fmtBRL(holders.length * 69.90 * 0.15)}</p>
              </div>
              <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div><p className="text-xs font-semibold text-slate-400 uppercase">DRE Contábil</p></div>
                <button onClick={() => setIsDREOpen(true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">Abrir DRE</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL TITULAR */}
      {isNewHolderOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4">+ Cadastrar Novo Titular</h3>
            <form onSubmit={handleSaveHolder} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome Completo:</label><input type="text" required value={holderForm.full_name} onChange={(e) => setHolderForm({ ...holderForm, full_name: e.target.value })} placeholder="Nome do titular..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-400 font-semibold mb-1">CPF:</label><input type="text" required value={holderForm.cpf} onChange={(e) => setHolderForm({ ...holderForm, cpf: e.target.value })} placeholder="000.000.000-00" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 font-semibold mb-1">Telefone:</label><input type="text" required value={holderForm.phone} onChange={(e) => setHolderForm({ ...holderForm, phone: e.target.value })} placeholder="(86) 99999-9999" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              </div>
              <div><label className="block text-slate-400 font-semibold mb-1">Endereço:</label><input type="text" value={holderForm.address} onChange={(e) => setHolderForm({ ...holderForm, address: e.target.value })} placeholder="Rua, Número..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewHolderOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" disabled={savingHolder} className="px-4 py-1.5 bg-emerald-600 font-bold rounded">{savingHolder ? 'Gravando...' : 'Salvar Titular'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÓBITO */}
      {isNewBurialOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="font-bold text-sm text-rose-400 mb-4">🚨 Registrar Chamado de Plantão / Óbito</h3>
            <form onSubmit={handleSaveBurial} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome do Falecido:</label><input type="text" required value={burialForm.deceased_name} onChange={(e) => setBurialForm({ ...burialForm, deceased_name: e.target.value })} placeholder="Nome da pessoa falecida..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Cemitério / Local:</label><input type="text" value={burialForm.cemetery_location} onChange={(e) => setBurialForm({ ...burialForm, cemetery_location: e.target.value })} placeholder="Cemitério..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Data e Horário:</label><input type="datetime-local" required value={burialForm.burial_date} onChange={(e) => setBurialForm({ ...burialForm, burial_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewBurialOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" disabled={savingBurial} className="px-4 py-1.5 bg-rose-600 font-bold rounded">{savingBurial ? 'Registrando...' : 'Confirmar Chamado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEPENDENTES */}
      {selectedHolder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div><h3 className="text-sm font-bold text-white">{selectedHolder.full_name}</h3><p className="text-xs text-slate-400">CPF: {selectedHolder.cpf}</p></div>
              <button onClick={() => setSelectedHolder(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-300 uppercase text-[11px] mb-2">Dependentes Cobertos:</p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {(selectedHolder.dependents || []).map((dep) => (
                    <div key={dep.id} className="p-2.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="font-medium text-slate-200">{dep.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded">{dep.relation}</span>
                    </div>
                  ))}
                  {(!selectedHolder.dependents || selectedHolder.dependents.length === 0) && (
                    <p className="text-slate-500 py-3 text-center">Nenhum dependente cadastrado.</p>
                  )}
                </div>
              </div>
              <form onSubmit={handleAddDep} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-blue-400 uppercase">+ Adicionar Dependente</p>
                <div className="flex gap-2">
                  <input type="text" required value={depName} onChange={(e) => setDepName(e.target.value)} placeholder="Nome do dependente..." className="flex-1 bg-[#0d121f] border border-slate-800 rounded p-2 text-white" />
                  <select value={depRelation} onChange={(e) => setDepRelation(e.target.value)} className="bg-[#0d121f] border border-slate-800 rounded p-2 text-white">
                    <option value="Cônjuge">Cônjuge</option><option value="Filho(a)">Filho(a)</option><option value="Pai/Mãe">Pai/Mãe</option><option value="Outro">Outro</option>
                  </select>
                  <button type="submit" disabled={savingDep} className="px-3 py-2 bg-blue-600 text-white font-bold rounded">{savingDep ? '...' : 'Adicionar'}</button>
                </div>
              </form>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button onClick={() => setSelectedHolder(null)} className="px-4 py-2 bg-slate-800 text-white rounded text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <ModalDRE isOpen={isDREOpen} onClose={() => setIsDREOpen(false)} />
      <ModalRBAC isOpen={isRBACOpen} onClose={() => setIsRBACOpen(false)} />
    </div>
  );
}