'use client';
import React, { useState } from 'react';
import { X, FileCheck, Send, ShieldCheck, CreditCard } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export function ModalContractEngine({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [holderName, setHolderName] = useState('');
  const [cpf, setCpf] = useState('');
  const [planValue, setPlanValue] = useState('59.90');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCreateContractAndBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // 1. Cria o contrato no Supabase
      const res = await authFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify({ holder_name: holderName, cpf, status: 'active' })
      });
      if (!res.ok) throw new Error('Erro ao criar contrato');
      const contract = await res.json();

      // 2. Simula o disparo de integração com a API Asaas para gerar a primeira cobrança
      await new Promise(r => setTimeout(r, 1000));
      
      await authFetch('/api/asaas/customers', {
        method: 'POST',
        body: JSON.stringify({ contract_id: contract.id, billing_type: 'BOLETO' })
      });

      // 3. Registra na trilha de auditoria
      await authFetch('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify({ action: 'CONTRACT_AND_ASAAS_GENERATE', details: 'Contrato gerado e faturamento Asaas configurado para ' + holderName })
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setHolderName('');
        setCpf('');
        onClose();
      }, 2000);
    } catch (err: any) {
      alert('Erro ao processar contrato e faturamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Emissão de Contrato & Cobrança Asaas</h2>
              <p className="text-xs text-zinc-400">Formalização digital e integração automática de faturas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateContractAndBilling} className="p-6 space-y-4">
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4" /> Contrato assinado e cobrança Asaas gerada com sucesso!
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome Completo do Titular</label>
            <input required type="text" value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Ex: Maria da Silva Santos" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">CPF do Titular</label>
              <input required type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Valor da Mensalidade (R$)</label>
              <input required type="text" value={planValue} onChange={e => setPlanValue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-zinc-300 font-bold">
              <CreditCard className="w-4 h-4 text-blue-400" /> Gatilho de Integração Ativo
            </div>
            <p className="text-[11px]">Ao confirmar, o sistema gerará o contrato com cláusulas padrão de assistência funerária e registrará a fatura recorrente diretamente no gateway Asaas.</p>
          </div>

          <button disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            {loading ? 'Processando Contrato e Asaas...' : 'Emitir Contrato & Gerar Fatura'}
          </button>
        </form>

      </div>
    </div>
  );
}
