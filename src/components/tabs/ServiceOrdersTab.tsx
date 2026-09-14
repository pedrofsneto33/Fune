// Extraido de page.tsx (~linha 2440). READ-ONLY.
// Foco: listagem + detalhes das Ordens de Servico integradas.

'use client';

import React, { useEffect, useState } from 'react';
import { ServiceOrder } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';

export default function ServiceOrdersTab() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loadingServiceOrders, setLoadingServiceOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingServiceOrders(true);
      try {
        const res = await authFetch('/api/service-orders');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancel && Array.isArray(data)) setServiceOrders(data);
      } catch (e) {
        notifyError('Erro ao carregar ordens de servico');
      } finally {
        if (!cancel) setLoadingServiceOrders(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const statusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'concluido') return 'bg-emerald-900/30 text-emerald-300';
    if (s === 'cancelled' || s === 'cancelado') return 'bg-rose-900/30 text-rose-300';
    if (s === 'in_progress' || s === 'em_traslado') return 'bg-amber-900/30 text-amber-300';
        return 'bg-slate-800 text-slate-300';
  };

  return (
    <div className="space-y-4">
      {/* LIST */}
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
            📋 Ordens de Serviço Integradas ({serviceOrders.length})
          </h3>
          {loadingServiceOrders && (
            <span className="text-[10px] text-slate-600 dark:text-slate-500">carregando...</span>
          )}
        </div>
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Falecido</th>
              <th className="py-3 px-4">Integrações</th>
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
            {serviceOrders.map((so) => (
              <tr key={so.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 dark:text-white">{so.deceased_name}</span>
                  <span className="block text-[10px] text-slate-600 dark:text-slate-500">
                    {so.deceased_type === 'holder'
                      ? 'Titular'
                      : so.deceased_type === 'dependent'
                        ? 'Dependente'
                        : 'Público geral'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {so.contract && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px]">
                        📄 {so.contract.plan?.name || 'Contrato'}
                      </span>
                    )}
                    {so.vehicle && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px]">
                        🚐 {so.vehicle.model}
                      </span>
                    )}
                    {so.items?.map((it) => (
                      <span
                        key={it.id}
                        className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]"
                      >
                        📦 {it.quantity}× {it.inventory?.item_name || 'item'}
                      </span>
                    ))}
                    {!so.contract && !so.vehicle && !so.items?.length && (
                      <span className="text-[10px] text-slate-500">Sem integrações</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px]">
                  {new Date(so.burial_date).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${statusClass(so.status)}`}>
                    {so.status || 'Agendado'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedOrder(so)}
                    className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded text-[11px] font-semibold"
                  >
                    👁️ Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
            {serviceOrders.length === 0 && !loadingServiceOrders && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-600 dark:text-slate-500">
                  Nenhuma ordem de serviço.
                </td>
              </tr>
            )}
          </tbody>
                </table>
      </div>

      {/* DETAILS MODAL (read-only) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-sm font-bold text-slate-200 mb-4">
              Detalhes da Ordem #{selectedOrder.id.slice(0, 8)}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Falecido:</span>
                <span className="text-slate-200 ml-2 font-semibold">{selectedOrder.deceased_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Tipo:</span>
                <span className="text-slate-200 ml-2">{selectedOrder.deceased_type}</span>
              </div>
              <div>
                <span className="text-slate-500">Data:</span>
                <span className="text-slate-200 ml-2">
                  {new Date(selectedOrder.burial_date).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Cemitério:</span>
                <span className="text-slate-200 ml-2">{selectedOrder.cemetery_location || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <span className={`ml-2 ${statusClass(selectedOrder.status)} px-2 py-0.5 rounded text-[10px]`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Integrações</p>
                {selectedOrder.contract && (
                  <div className="text-slate-300">📄 Contrato: {selectedOrder.contract.plan?.name || 'Ativo'}</div>
                )}
                {selectedOrder.vehicle && (
                  <div className="text-slate-300">🚐 Veículo: {selectedOrder.vehicle.model}</div>
                )}
                {selectedOrder.items?.length ? (
                  <div className="text-slate-300 mt-1">
                    📦 Itens de estoque:
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="ml-2">
                        {it.quantity}× {it.inventory?.item_name || 'item'}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500">Sem itens de estoque</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

