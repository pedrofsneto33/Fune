'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, Phone, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

interface PaymentRow {
  id: string;
  holderId: string;
  holder: string;
  cpf: string;
  phone: string;
  plan: string;
  amount: string;
  dueDate: string;
  status: string;
}

interface ModalWhatsAppBatchBillingProps {
  isOpen: boolean;
  onClose: () => void;
  payments: PaymentRow[];
}

export function ModalWhatsAppBatchBilling({
  isOpen,
  onClose,
  payments = []
}: ModalWhatsAppBatchBillingProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    payments.filter(p => p.status !== 'Pago').map(p => p.id)
  );
  const [customMsgTemplate, setCustomMsgTemplate] = useState(
    'Olá, {nome}! Informamos que a mensalidade do seu plano {plano} no valor de {valor} tem vencimento em {vencimento}. Para pagar via PIX com baixa imediata, utilize nossa chave CNPJ: 00.000.000/0001-00. Qualquer dúvida estamos à disposição!'
  );
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const pendingList = payments.filter(p => p.status !== 'Pago');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingList.map(p => p.id));
    }
  };

  const handleSendSingle = (item: PaymentRow) => {
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const text = customMsgTemplate
      .replace('{nome}', item.holder)
      .replace('{plano}', item.plan)
      .replace('{valor}', item.amount)
      .replace('{vencimento}', item.dueDate || '10 deste mês');

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encoded}`, '_blank');
    setSentMap(prev => ({ ...prev, [item.id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Régua de Cobrança WhatsApp em Massa</h2>
              <p className="text-xs text-zinc-400">Disparo de avisos de vencimento e chave PIX para associados pendentes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Template da Mensagem */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Modelo da Mensagem (Tags dinâmicas: {`{nome}`}, {`{plano}`}, {`{valor}`}, {`{vencimento}`})</label>
            <textarea
              rows={3}
              value={customMsgTemplate}
              onChange={(e) => setCustomMsgTemplate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-green-500 font-sans"
            />
          </div>

          {/* Lista de Associados Pendentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Fila de Inadimplência / Pendentes ({pendingList.length})
              </h3>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                {selectedIds.length === pendingList.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/40 border border-zinc-800 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-300 font-semibold">Tudo em dia! Nenhum associado pendente no momento.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pendingList.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  const isSent = !!sentMap[item.id];

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                        isSent
                          ? 'bg-zinc-950/40 border-zinc-800 opacity-60'
                          : isChecked
                          ? 'bg-zinc-950/80 border-green-500/40'
                          : 'bg-zinc-950/40 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-zinc-700 text-green-600 focus:ring-0 w-4 h-4 bg-zinc-900 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{item.holder}</p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <span>{item.phone}</span>
                            <span>•</span>
                            <span>{item.plan}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-semibold">{item.amount}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => handleSendSingle(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow ${
                            isSent
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-green-600 hover:bg-green-500 text-white shadow-green-950/40'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          {isSent ? 'Reenviar' : 'Enviar WhatsApp'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
