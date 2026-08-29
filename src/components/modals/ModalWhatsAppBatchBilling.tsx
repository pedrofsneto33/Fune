'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, X, Check, Calendar, AlertTriangle, Send, DollarSign, Filter, Users, ExternalLink } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { formatWhatsAppMessage } from '@/lib/whatsapp';

interface ModalWhatsAppBatchBillingProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
}

export function ModalWhatsAppBatchBilling({ isOpen, onClose, payments }: ModalWhatsAppBatchBillingProps) {
  const { currentTenant } = useTenant();
  const [filterType, setFilterType] = useState<'all_pending' | 'today' | 'in_3_days' | 'in_5_days' | 'overdue'>('in_3_days');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  // Calcular datas relativas
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const getDaysDiff = (dueDateStr: string) => {
    if (!dueDateStr) return 999;
    const due = new Date(dueDateStr);
    const today = new Date(todayStr);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtragem da lista
  const targetPayments = useMemo(() => {
    return payments.filter((p) => {
      const isPending = p.status === 'Pendente' || p.status === 'Atrasado';
      if (!isPending) return false;

      const diff = getDaysDiff(p.dueDate || p.due_date);

      switch (filterType) {
        case 'today':
          return diff === 0;
        case 'in_3_days':
          return diff >= 0 && diff <= 3;
        case 'in_5_days':
          return diff >= 0 && diff <= 5;
        case 'overdue':
          return diff < 0;
        case 'all_pending':
        default:
          return true;
      }
    });
  }, [payments, filterType, todayStr]);

  // Inicializar seleção automática ao mudar de filtro
  React.useEffect(() => {
    setSelectedIds(targetPayments.map((p) => p.id || p.contract_id || p.holder));
  }, [targetPayments]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === targetPayments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(targetPayments.map((p) => p.id || p.contract_id || p.holder));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalAmount = targetPayments
    .filter((p) => selectedIds.includes(p.id || p.contract_id || p.holder))
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const handleSendSingle = (p: any) => {
    const cleanPhone = (p.phone || '').replace(/\D/g, '');
    let fullPhone = cleanPhone;
    if (fullPhone.length === 10 || fullPhone.length === 11) {
      fullPhone = `55${fullPhone}`;
    }

    const encodedText = formatWhatsAppMessage({
      holderName: p.holder || p.full_name,
      planName: p.plan,
      amount: p.amount,
      dueDate: p.dueDate || p.due_date,
      bankSlipUrl: p.bankSlipUrl || p.bank_slip_url || p.invoiceUrl,
      identificationField: p.identificationField || p.identification_field,
      tenantName: currentTenant?.name || 'Eternity SOS'
    });

    const url = fullPhone.length >= 12
      ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, '_blank');

    const key = p.id || p.contract_id || p.holder;
    setSentMap((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Régua de Cobrança & Lembretes WhatsApp</h3>
              <p className="text-xs text-zinc-400">Disparo em lote de notificações com link do carnê/boleto e PIX.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros de Vencimento */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={() => setFilterType('in_3_days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'in_3_days'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Vencendo em até 3 dias
          </button>
          <button
            onClick={() => setFilterType('in_5_days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'in_5_days'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Vencendo em até 5 dias
          </button>
          <button
            onClick={() => setFilterType('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'today'
                ? 'bg-amber-600/20 text-amber-400 border-amber-500/40'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Vencendo Hoje
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'overdue'
                ? 'bg-red-600/20 text-red-400 border-red-500/40'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Atrasados / Vencidos
          </button>
          <button
            onClick={() => setFilterType('all_pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'all_pending'
                ? 'bg-zinc-800 text-white border-zinc-600'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Todos os Pendentes
          </button>
        </div>

        {/* Resumo de Seleção */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center text-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="text-blue-400 hover:underline font-semibold"
            >
              {selectedIds.length === targetPayments.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">
              <strong className="text-white">{selectedIds.length}</strong> de {targetPayments.length} associados selecionados
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-400">Total a Notificar: </span>
            <strong className="text-emerald-400 font-mono text-sm">
              R$ {totalAmount.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Lista de Associados */}
        <div className="overflow-y-auto flex-1 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 bg-zinc-950/50">
          {targetPayments.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 italic text-xs">
              Nenhum associado encontrado para este filtro de vencimento.
            </div>
          ) : (
            targetPayments.map((p, idx) => {
              const key = p.id || p.contract_id || p.holder;
              const isSelected = selectedIds.includes(key);
              const isSent = sentMap[key];
              const diff = getDaysDiff(p.dueDate || p.due_date);

              return (
                <div
                  key={idx}
                  className={`p-3 flex items-center justify-between gap-3 text-xs transition ${
                    isSelected ? 'bg-zinc-900/40' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(key)}
                      className="rounded border-zinc-700 text-blue-600 focus:ring-0 w-4 h-4 bg-zinc-800"
                    />
                    <div>
                      <p className="font-semibold text-white flex items-center gap-2">
                        {p.holder || p.full_name}
                        {isSent && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] flex items-center gap-1 font-normal">
                            <Check className="w-3 h-3" /> Enviado
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        Tel: {p.phone || 'Sem telefone'} • Plano: {p.plan}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono text-white font-bold">R$ {p.amount}</p>
                      <p
                        className={`text-[10px] font-semibold ${
                          diff < 0
                            ? 'text-red-400'
                            : diff === 0
                            ? 'text-amber-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {diff < 0
                          ? `Atrasado há ${Math.abs(diff)} dias`
                          : diff === 0
                          ? 'Vence Hoje'
                          : `Vence em ${diff} dias (${p.dueDate || p.due_date})`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSendSingle(p)}
                      title="Disparar no WhatsApp"
                      className={`p-2 rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition shadow-md ${
                        isSent
                          ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSent ? 'Reenviar' : 'Enviar'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="flex justify-between items-center pt-3 border-t border-zinc-800 flex-shrink-0">
          <p className="text-[11px] text-zinc-500">
            * O envio abre a conversa direta no WhatsApp Web / Desktop com a mensagem pré-formatada.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}