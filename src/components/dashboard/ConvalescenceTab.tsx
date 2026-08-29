'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  User,
  Phone,
  Package,
  FileCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export function ConvalescenceTab() {
  const { currentTenant } = useTenant();
  const [items, setItems] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'loans' | 'items'>('loans');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);

  // Form states - Novo Empréstimo
  const [selectedItemId, setSelectedItemId] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderCpf, setHolderCpf] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60); // Padrão 60 dias de comodato
    return d.toISOString().split('T')[0];
  });
  const [depositAmount, setDepositAmount] = useState('0.00');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states - Devolução
  const [returnCondition, setReturnCondition] = useState('Bom');
  const [returnNotes, setReturnNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/convalescence?tenant_id=${currentTenant?.id || 'matriz'}`);
      const data = await res.json();
      setItems(data.items || []);
      setLoans(data.loans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const availableItems = items.filter((i) => i.status === 'Disponível');

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/convalescence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOAN',
          tenant_id: currentTenant?.id || 'matriz',
          item_id: selectedItemId,
          holder_name: holderName,
          holder_cpf: holderCpf,
          holder_phone: holderPhone,
          beneficiary_name: beneficiaryName,
          expected_return_date: expectedReturnDate,
          deposit_amount: depositAmount,
          observations
        })
      });
      if (res.ok) {
        setIsNewLoanOpen(false);
        // Reset form
        setSelectedItemId('');
        setHolderName('');
        setHolderCpf('');
        setHolderPhone('');
        setBeneficiaryName('');
        setObservations('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/convalescence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETURN',
          loan_id: selectedLoan.id,
          item_id: selectedLoan.item_id,
          return_condition: returnCondition,
          observations: returnNotes
        })
      });
      if (res.ok) {
        setIsReturnModalOpen(false);
        setSelectedLoan(null);
        setReturnNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredLoans = loans.filter((l) =>
    (l.holder_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.holder_cpf || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Comodato & Convalescença</h2>
            <p className="text-xs text-zinc-400">Empréstimo rastreado de cadeiras de rodas, banho, camas hospitalares e muletas.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveSubTab('loans')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'loans' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Empréstimos Ativos ({loans.filter((l) => l.status === 'Ativo').length})
            </button>
            <button
              onClick={() => setActiveSubTab('items')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'items' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Inventário ({items.length})
            </button>
          </div>

          <button
            onClick={() => setIsNewLoanOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Empréstimo
          </button>
        </div>
      </div>

      {/* Visão de Empréstimos */}
      {activeSubTab === 'loans' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por titular ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Titular / Beneficiário</th>
                  <th className="py-3 px-4">Equipamento (Tombamento)</th>
                  <th className="py-3 px-4">Retirada / Devolução Prevista</th>
                  <th className="py-3 px-4">Status / Prazos</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                      Nenhum empréstimo registrado.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((l, idx) => {
                    const diff = getDaysDiff(l.expected_return_date);
                    const isOverdue = diff < 0 && l.status === 'Ativo';

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{l.holder_name}</p>
                          <p className="text-[11px] text-zinc-400">
                            CPF: {l.holder_cpf || 'S/N'} • Tel: {l.holder_phone || 'S/N'}
                          </p>
                          {l.beneficiary_name && (
                            <p className="text-[10px] text-zinc-500">Paciente: {l.beneficiary_name}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{l.convalescence_items?.name || 'Equipamento'}</p>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                            {l.convalescence_items?.code || 'TOMBO-S/N'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-zinc-300">Saída: {l.loan_date}</p>
                          <p className="text-[11px] text-zinc-400 font-medium">Previsto: {l.expected_return_date}</p>
                        </td>
                        <td className="py-3 px-4">
                          {l.status === 'Devolvido' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Devolvido em {l.actual_return_date}
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-max">
                              <AlertTriangle className="w-3 h-3" /> Atrasado ({Math.abs(diff)}d)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Em uso ({diff}d restantes)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {l.status === 'Ativo' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(l);
                                setIsReturnModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Registrar Devolução
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visão de Inventário */}
      {activeSubTab === 'items' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs px-2 py-0.5 bg-zinc-950 rounded border border-zinc-800 text-blue-400 font-bold">
                  {item.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'Disponível'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.status === 'Emprestado'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{item.name}</h4>
                <p className="text-xs text-zinc-400">Categoria: {item.category} • Estado: {item.condition}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Empréstimo */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Termo de Comodato & Retirada</h3>
              </div>
              <button onClick={() => setIsNewLoanOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Equipamento Disponível *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Selecione o Equipamento --</option>
                  {availableItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      [{i.code}] {i.name} - Estado: {i.condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">Nome do Titular do Plano *</label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Nome do associado"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">CPF do Titular</label>
                  <input
                    type="text"
                    value={holderCpf}
                    onChange={(e) => setHolderCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">WhatsApp de Contato</label>
                  <input
                    type="text"
                    value={holderPhone}
                    onChange={(e) => setHolderPhone(e.target.value)}
                    placeholder="(86) 99999-9999"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Paciente / Beneficiário</label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="Nome de quem utilizará"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Previsão de Devolução *</label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Observações do Comodato</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Entregue com almofada e suporte de pés intactos..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewLoanOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedItemId || !holderName}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Emitindo...' : 'Assinar e Concluir Empréstimo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Devolução */}
      {isReturnModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Vistoria & Devolução de Comodato</h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleReturnItem} className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-300 space-y-1">
                <p>Equipamento: <strong className="text-white">{selectedLoan.convalescence_items?.name}</strong></p>
                <p>Tombamento: <strong className="text-blue-400 font-mono">{selectedLoan.convalescence_items?.code}</strong></p>
                <p>Titular: <span className="text-zinc-200">{selectedLoan.holder_name}</span></p>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Estado de Conservação no Retorno</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ótimo">Ótimo (Sem avarias)</option>
                  <option value="Bom">Bom (Uso regular normal)</option>
                  <option value="Regular">Regular (Pequeno desgaste)</option>
                  <option value="Manutenção">Avariado (Encaminhar p/ Manutenção)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Laudo / Observação da Vistoria</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Higienização realizada, pneus calibrados, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {submitting ? 'Processando...' : 'Confirmar Devolução & Baixar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}