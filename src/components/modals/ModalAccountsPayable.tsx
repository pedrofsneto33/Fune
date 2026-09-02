'use client';
import React, { useEffect, useState } from 'react';
import { X, DollarSign, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export function ModalAccountsPayable({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) fetchBills();
  }, [isOpen]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/accounts-payable');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar contas');
      setBills(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/accounts-payable', {
        method: 'POST',
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          due_date: dueDate,
          status: 'pendente',
        }),
      });
      if (!res.ok) throw new Error('Erro ao cadastrar despesa');
      setDescription('');
      setAmount('');
      setDueDate('');
      fetchBills();
    } catch (err: any) {
      alert('Erro ao cadastrar despesa: ' + err.message);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const res = await authFetch(`/api/accounts-payable?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pago' }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      fetchBills();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Contas a Pagar & Despesas Operacionais</h2>
              <p className="text-xs text-zinc-400">Controle de fornecedores, insumos e obrigações financeiras</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <form onSubmit={handleAddBill} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Descrição</label>
              <input required type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Lote de Urnas MDF" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Vencimento</label>
              <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <button type="submit" className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 h-[34px]">
              <PlusCircle className="w-4 h-4" /> Adicionar Conta
            </button>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Faturas e Obrigações Registradas</h3>
            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-500 animate-pulse">Carregando contas...</div>
            ) : bills.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">Nenhuma conta a pagar cadastrada.</div>
            ) : (
              bills.map(bill => (
                <div key={bill.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold">{bill.description}</span>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>Vencimento: <strong className="text-zinc-300">{new Date(bill.due_date).toLocaleDateString('pt-BR')}</strong></span>
                      <span>Valor: <strong className="text-red-400 font-mono">R$ {Number(bill.amount).toFixed(2).replace('.', ',')}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${bill.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                      {bill.status}
                    </span>
                    {bill.status === 'pendente' && (
                      <button onClick={() => handleMarkAsPaid(bill.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition">
                        Baixar Pagamento
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition">
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
