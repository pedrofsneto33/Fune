'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPinned,
  Plus,
  Search,
  DollarSign,
  User,
  Phone,
  CheckCircle2,
  Receipt,
  Printer,
  Calendar,
  Layers,
  ArrowDownCircle
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export function CollectorRoutesTab() {
  const { currentTenant } = useTenant();
  const [routes, setRoutes] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'routes'>('receipts');

  // Modais
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<any | null>(null);

  // Form states
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [collectorName, setCollectorName] = useState('');
  const [contractId, setContractId] = useState('');
  const [holderName, setHolderName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/collector?tenant_id=${currentTenant?.id || 'matriz'}`);
      const data = await res.json();
      setRoutes(data.routes || []);
      setReceipts(data.receipts || []);
      if (data.routes && data.routes.length > 0 && !collectorName) {
        setCollectorName(data.routes[0].collector_name);
        setSelectedRouteId(data.routes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/billing/collector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id || 'matriz',
          route_id: selectedRouteId || null,
          collector_name: collectorName,
          contract_id: contractId || null,
          holder_name: holderName,
          amount_collected: Number(amount),
          payment_method: paymentMethod,
          notes
        })
      });

      if (res.ok) {
        setIsReceiptModalOpen(false);
        setHolderName('');
        setContractId('');
        setAmount('');
        setNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollectedToday = receipts
    .filter((r) => r.received_at && r.received_at.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((acc, r) => acc + Number(r.amount_collected || 0), 0);

  const filteredReceipts = receipts.filter((r) =>
    (r.holder_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.collector_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <MapPinned className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Rotas de Cobrança Presencial & Cobrador</h2>
            <p className="text-xs text-zinc-400">Borderô diário, baixas porta a porta e prestação de contas de rua.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'receipts' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Borderô de Recebimentos ({receipts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('routes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'routes' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Rotas Cadastradas ({routes.length})
            </button>
          </div>

          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            Lançar Baixa do Cobrador
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Arrecadado Hoje (Rua)</span>
            <h3 className="text-xl font-bold font-mono text-emerald-400 mt-1">
              R$ {totalCollectedToday.toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Total de Baixas Lançadas</span>
            <h3 className="text-xl font-bold font-mono text-white mt-1">{receipts.length}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Rotas Ativas</span>
            <h3 className="text-xl font-bold font-mono text-amber-400 mt-1">{routes.length}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <MapPinned className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visão de Recebimentos */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por associado ou cobrador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Associado / Contrato</th>
                  <th className="py-3 px-4">Cobrador / Rota</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Valor & Forma</th>
                  <th className="py-3 px-4 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                      Nenhum recebimento registrado pelo cobrador.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{r.holder_name}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">Contrato: {r.contract_id || 'S/N'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-zinc-200 font-medium">{r.collector_name}</p>
                        <p className="text-[10px] text-zinc-400">{r.collection_routes?.name || 'Rota Padrão'}</p>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {new Date(r.received_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-emerald-400 font-mono">R$ {Number(r.amount_collected).toFixed(2)}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                          {r.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceiptForPrint(r)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visão de Rotas */}
      {activeSubTab === 'routes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {routes.map((rt, idx) => (
            <div key={idx} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-md">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-white text-sm">{rt.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {rt.status}
                </span>
              </div>
              <p className="text-xs text-zinc-300">Cobrador: <strong>{rt.collector_name}</strong></p>
              <p className="text-xs text-zinc-400">Tel: {rt.collector_phone || 'S/N'}</p>
              <p className="text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800/60">
                Bairros: {rt.neighborhoods}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lançar Baixa do Cobrador */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Baixa de Mensalidade (Cobrador de Rua)</h3>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Cobrador Responsável *</label>
                  <input
                    type="text"
                    required
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    placeholder="Nome do cobrador"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Rota de Cobrança</label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Sem rota vinculada --</option>
                    {routes.map((rt) => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nome do Titular *</label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Nome do associado"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nº do Contrato</label>
                  <input
                    type="text"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    placeholder="Ex: CT-0042"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Valor Recebido (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 65.00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Dinheiro">Dinheiro em Espécie</option>
                    <option value="PIX Presencial">PIX Presencial</option>
                    <option value="Cartão Maquininha">Cartão na Maquininha</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Observações / Recibo Manual</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Número do talão manual ou referência do recibo..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !holderName || !amount}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Confirmar Recebimento & Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Impressão de Recibo do Cobrador */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Comprovante de Pagamento</h3>
              <button onClick={() => setSelectedReceiptForPrint(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {/* Recibo formato térmico 80mm */}
            <div className="bg-white text-black p-4 rounded font-mono text-xs space-y-2 border border-zinc-400 shadow-inner">
              <div className="text-center border-b border-black pb-2">
                <p className="font-bold text-sm">{currentTenant?.name || 'ETERNITY SOS'}</p>
                <p className="text-[10px]">CNPJ: {currentTenant?.cnpj || '43.210.987/0001-54'}</p>
                <p className="text-[10px]">RECIBO DE MENSALIDADE - VIA DO CLIENTE</p>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <p><strong>Titular:</strong> {selectedReceiptForPrint.holder_name}</p>
                <p><strong>Contrato:</strong> {selectedReceiptForPrint.contract_id || 'S/N'}</p>
                <p><strong>Data:</strong> {new Date(selectedReceiptForPrint.received_at).toLocaleString('pt-BR')}</p>
                <p><strong>Cobrador:</strong> {selectedReceiptForPrint.collector_name}</p>
                <p><strong>Forma:</strong> {selectedReceiptForPrint.payment_method}</p>
                <div className="border-t border-b border-dashed border-black py-1.5 my-1 flex justify-between font-bold text-sm">
                  <span>VALOR PAGO:</span>
                  <span>R$ {Number(selectedReceiptForPrint.amount_collected).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px]">
                <p>Obrigado por manter seu plano em dia!</p>
                <p>Central de Atendimento 24h: (86) 3222-0000</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedReceiptForPrint(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}