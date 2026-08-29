'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Users,
  CreditCard,
  MessageSquare,
  Eye,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface PaymentRow {
  id: string;
  holderId: string;
  holder: string;
  cpf: string;
  phone: string;
  plan: string;
  amount: string;
  dueDate: string;
  method: string;
  status: string;
}

interface AssociatesTabProps {
  payments: PaymentRow[];
  loading: boolean;
  onOpenDependentModal: (item: PaymentRow) => void;
  onOpenCard: (cpf: string) => void;
  onOpenPixModal: (item: PaymentRow) => void;
  onSendWhatsApp: (item: PaymentRow) => void;
  onMarkAsPaid: (paymentId: string) => void;
}

export function AssociatesTab({
  payments = [],
  loading = false,
  onOpenDependentModal,
  onOpenCard,
  onOpenPixModal,
  onSendWhatsApp,
  onMarkAsPaid
}: AssociatesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [planFilter, setPlanFilter] = useState('Todos');

  const searchLower = (searchTerm || '').toLowerCase().trim();
  const cleanSearch = searchLower.replace(/\D/g, '');

  const filtered = payments.filter((p) => {
    const holderName = (p.holder || '').toLowerCase();
    const cleanCpf = (p.cpf || '').replace(/\D/g, '');

    const matchSearch =
      !searchLower ||
      holderName.includes(searchLower) ||
      (cleanSearch ? cleanCpf.includes(cleanSearch) : (p.cpf || '').includes(searchLower));

    const matchStatus = statusFilter === 'Todos' || p.status === statusFilter;
    const matchPlan = planFilter === 'Todos' || p.plan === planFilter;

    return matchSearch && matchStatus && matchPlan;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none"
              >
                <option value="Todos">Status: Todos</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none"
              >
                <option value="Todos">Planos: Todos</option>
                <option value="Familiar Ouro">Familiar Ouro</option>
                <option value="Individual Prata">Individual Prata</option>
                <option value="Corporativo">Corporativo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Associates Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Carteira de Associados</h3>
            <p className="text-xs text-zinc-400">Total de {filtered.length} contratos localizados</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/60 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">Titular</th>
                <th className="px-5 py-3.5">CPF</th>
                <th className="px-5 py-3.5">Telefone</th>
                <th className="px-5 py-3.5">Plano Contratado</th>
                <th className="px-5 py-3.5">Mensalidade</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                    Sincronizando com o Supabase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                    Nenhum associado encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-3.5 font-medium text-white">{item.holder}</td>
                    <td className="px-5 py-3.5 font-mono text-zinc-400">{item.cpf}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{item.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-200">
                        {item.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-semibold">{item.amount}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          item.status === 'Pago'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {item.status !== 'Pago' && (
                        <button
                          onClick={() => onMarkAsPaid(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                          title="Confirmar pagamento manual"
                        >
                          Baixar
                        </button>
                      )}
                      <button
                        onClick={() => onOpenPixModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/50 transition font-medium"
                      >
                        PIX
                      </button>
                      <button
                        onClick={() => onOpenDependentModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
                      >
                        Dependentes
                      </button>
                      <button
                        onClick={() => onOpenCard(item.cpf)}
                        className="px-2.5 py-1 rounded-lg bg-blue-950/50 text-blue-400 hover:bg-blue-900 border border-blue-800/50 transition"
                      >
                        Carteirinha
                      </button>
                      <button
                        onClick={() => onSendWhatsApp(item)}
                        className="px-2.5 py-1 rounded-lg bg-green-950/50 text-green-400 hover:bg-green-900 border border-green-800/50 transition"
                        title="Cobrar WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
