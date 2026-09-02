'use client';
import React, { useEffect, useState } from 'react';
import { X, FileText, Barcode, CheckCircle2, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export function ModalCarnets({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [carnets, setCarnets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) fetchCarnets();
  }, [isOpen]);

  const fetchCarnets = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/payment-carnets'); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Erro ao carregar carnês');
      
      setCarnets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCarnetBatch = async () => {
    try {
      // Simulação de geração de carnê de 12 meses para contratos ativos
      const res0 = await authFetch('/api/contracts?status=active'); const activeContracts = await res0.json();
      if (!activeContracts || activeContracts.length === 0) {
        alert('Nenhum contrato ativo encontrado para gerar carnê.');
        return;
      }

      for (const contract of activeContracts) {
        const batch = [];
        for (let i = 1; i <= 12; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          batch.push({
            contract_id: contract.id,
            installment_number: i,
            total_installments: 12,
            due_date: dueDate.toISOString().split('T')[0],
            amount: 59.90,
            status: 'pendente'
          });
        }
        await authFetch('/api/payment-carnets/batch', { method: 'POST', body: JSON.stringify(batch) });
      }

      alert('Lote de carnês gerado com sucesso para todos os titulares ativos!');
      fetchCarnets();
    } catch (err: any) {
      alert('Erro ao gerar lote: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Central de Carnês & Conciliação de Faturas</h2>
              <p className="text-xs text-zinc-400">Emissão de parcelamentos em lote e controle de recebimentos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleGenerateCarnetBatch} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Gerar Lote Anual
            </button>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">Carregando faturas e carnês...</div>
          ) : carnets.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
              Nenhum carnê gerado no sistema. Clique em &quot;Gerar Lote Anual&quot; para iniciar.
            </div>
          ) : (
            carnets.map(carnet => (
              <div key={carnet.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{carnet.contracts?.holder_name || 'Titular não vinculado'}</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono text-[10px]">
                      Parcela {carnet.installment_number}/{carnet.total_installments}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
                    <span>Vencimento: <strong className="text-zinc-200">{new Date(carnet.due_date).toLocaleDateString('pt-BR')}</strong></span>
                    <span>Valor: <strong className="text-emerald-400 font-mono">R$ {Number(carnet.amount).toFixed(2).replace('.', ',')}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${carnet.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/25'}`}>
                    {carnet.status}
                  </span>
                  <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition" title="Copiar Linha Digitável / PIX">
                    <Barcode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
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
