// Criado na fase 4d-1. UI nova para APIs orfas (nao existe codigo em
// page.tsx para copiar). Sub-secoes: missoes, auditoria e rotas de coletor.
// Depende do GET /api/dispatches (criado no 4d-1 junto com este componente).

'use client';

import React, { useEffect, useState } from 'react';
import { Dispatch, DispatchAuditLog, CollectorRoute } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function LogisticsTab() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loadingDispatches, setLoadingDispatches] = useState(false);

  const [routes, setRoutes] = useState<CollectorRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Modal "Fechar missao"
  const [closeTarget, setCloseTarget] = useState<Dispatch | null>(null);
  const [odometerEnd, setOdometerEnd] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [notes, setNotes] = useState('');
  const [closing, setClosing] = useState(false);

  // Modal "Ver logs" (auditoria read-only)
  const [logTarget, setLogTarget] = useState<Dispatch | null>(null);
  const [logs, setLogs] = useState<DispatchAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal "Nova rota"
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeZone, setRouteZone] = useState('');
  const [routeStatus, setRouteStatus] = useState('ativo');
  const [savingRoute, setSavingRoute] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingDispatches(true);
      try {
        const res = await authFetch('/api/dispatches');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancel && Array.isArray(data)) setDispatches(data);
      } catch {
        notifyError('Erro ao carregar missoes');
      } finally {
        if (!cancel) setLoadingDispatches(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingRoutes(true);
      try {
        const res = await authFetch('/api/collector-routes');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancel && Array.isArray(data)) setRoutes(data);
      } catch {
        notifyError('Erro ao carregar rotas de coletor');
      } finally {
        if (!cancel) setLoadingRoutes(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const refetchDispatches = async () => {
    const res = await authFetch('/api/dispatches');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setDispatches(data);
  };

  const refetchRoutes = async () => {
    const res = await authFetch('/api/collector-routes');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRoutes(data);
  };
const openCloseModal = (d: Dispatch) => {
    setCloseTarget(d);
    setOdometerEnd('');
    setFuelLiters('');
    setFuelCost('');
    setNotes('');
  };

  const handleCloseDispatch = async () => {
    if (!closeTarget) return;
    const odometerEndNum = Number(odometerEnd);
    if (odometerEnd.trim() === '' || Number.isNaN(odometerEndNum)) {
      notifyError('Informe o odometro final (obrigatorio).');
      return;
    }
    setClosing(true);
    try {
      const res = await authFetch('/api/dispatches/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_id: closeTarget.id,
          vehicle_id: closeTarget.vehicle_id,
          odometer_end: odometerEndNum,
          fuel_liters_added: fuelLiters.trim() !== '' ? Number(fuelLiters) : 0,
          fuel_cost: fuelCost.trim() !== '' ? Number(fuelCost) : 0,
          notes: notes.trim() !== '' ? notes : undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 400 mantem o modal aberto (ex.: odometro menor que o inicial)
        notifyError('Erro: ' + (j.error || 'falha ao fechar missao'));
        if (res.status === 400) return;
        setCloseTarget(null);
        return;
      }
      notifySuccess('Missao finalizada com sucesso.');
      setCloseTarget(null);
      await refetchDispatches();
    } catch {
      notifyError('Erro de conexao ao fechar missao.');
    } finally {
      setClosing(false);
    }
  };

  const handleOpenLogs = async (d: Dispatch) => {
    setLogTarget(d);
    setLogs([]);
    setLoadingLogs(true);
    try {
      const res = await authFetch(
        `/api/dispatches/audit?dispatch_id=${encodeURIComponent(d.id)}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setLogs(Array.isArray(j.logs) ? j.logs : []);
    } catch {
      notifyError('Erro ao carregar auditoria.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateRoute = async () => {
    if (routeName.trim() === '' || routeZone.trim() === '') {
      notifyError('Preencha coletor e zona.');
      return;
    }
    setSavingRoute(true);
    try {
      const res = await authFetch('/api/collector-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collector_name: routeName,
          zone: routeZone,
          status: routeStatus,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        notifyError('Erro: ' + (j.error || 'falha ao criar rota'));
        return;
      }
      notifySuccess('Rota de coletor criada.');
      setRouteModalOpen(false);
      setRouteName('');
      setRouteZone('');
      setRouteStatus('ativo');
      await refetchRoutes();
    } catch {
      notifyError('Erro de conexao ao criar rota.');
    } finally {
      setSavingRoute(false);
    }
  };

  const statusClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('finaliz')) return 'bg-emerald-900/30 text-emerald-300';
    if (s.includes('cancel')) return 'bg-rose-900/30 text-rose-300';
    return 'bg-amber-900/30 text-amber-300';
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none';

  return (
    <div className="space-y-4">
{/* SUB-SECAO 1: MISSOES */}
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
            🚐 Missoes ({dispatches.length})
          </h3>
          {loadingDispatches && (
            <span className="text-[10px] text-slate-600 dark:text-slate-500">carregando...</span>
          )}
        </div>
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Veiculo</th>
              <th className="py-3 px-4">Motorista</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Odo. Inicial</th>
              <th className="py-3 px-4">Inicio</th>
              <th className="py-3 px-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
            {dispatches.map((d) => (
              <tr key={d.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {d.vehicle_plate || '—'}
                  </span>
                </td>
                <td className="py-3 px-4">{d.driver_agent || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${statusClass(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-4">{d.odometer_start ? `${d.odometer_start} km` : '—'}</td>
                <td className="py-3 px-4">
                  {d.created_at ? new Date(d.created_at).toLocaleString('pt-BR') : '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    {d.status.toLowerCase() !== 'finalizado' && (
                      <button
                        onClick={() => openCloseModal(d)}
                        className="px-2.5 py-1 rounded text-[11px] bg-blue-950 text-blue-300 hover:bg-blue-900"
                      >
                        Fechar missao
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenLogs(d)}
                      disabled={loadingLogs && logTarget?.id === d.id}
                      className="px-2.5 py-1 rounded text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                    >
                      Ver logs
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dispatches.length === 0 && !loadingDispatches && (
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            Nenhuma missao encontrada. As missoes sao criadas por fluxos externos
            (agente WhatsApp / integracao).
          </div>
        )}
      </div>
{/* SUB-SECAO 2: ROTAS DE COLETOR */}
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
            🛺 Rotas de Coletor ({routes.length})
          </h3>
          <button
            onClick={() => setRouteModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
          >
            + Nova rota
          </button>
        </div>
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Coletor</th>
              <th className="py-3 px-4">Zona</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Recibos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
            {routes.map((r) => (
              <tr key={r.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  {r.collector_name}
                </td>
                <td className="py-3 px-4">{r.zone}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${statusClass(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">{r.total_receipts ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {routes.length === 0 && !loadingRoutes && (
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            Nenhuma rota cadastrada.
          </div>
        )}
      </div>
{/* MODAL: FECHAR MISSAO */}
      {closeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-sm font-bold text-slate-200 mb-4">
              Fechar missao #{(closeTarget.id || '').slice(0, 8)}
            </h3>
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Veiculo: <span className="text-slate-200">{closeTarget.vehicle_plate || '—'}</span>
                <span className="ml-3">
                  Odo. inicial:{' '}
                  <span className="text-slate-200">
                    {closeTarget.odometer_start ? `${closeTarget.odometer_start} km` : '—'}
                  </span>
                </span>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Odometro final (km) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={odometerEnd}
                  onChange={(e) => setOdometerEnd(e.target.value)}
                  className={inputClass}
                  placeholder="Ex.: 84500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Combustivel (litros)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Custo do combustivel (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Observacoes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={inputClass}
                  placeholder="Ocorrencias da missao (opcional)"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCloseTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseDispatch}
                disabled={closing}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-sm font-semibold disabled:opacity-50"
              >
                {closing ? 'Finalizando...' : 'Finalizar missao'}
              </button>
            </div>
          </div>
        </div>
      )}
{/* MODAL: AUDITORIA (read-only) */}
      {logTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Auditoria da missao #{(logTarget.id || '').slice(0, 8)}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Veiculo {logTarget.vehicle_plate || '—'} · {logTarget.driver_agent || 'motorista nao informado'}
            </p>
            {loadingLogs ? (
              <div className="text-xs text-slate-500 py-6 text-center">carregando logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                Nenhum log de auditoria registrado.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-slate-800 rounded-lg p-3 text-xs"
                  >
                    <div className="flex justify-between text-slate-400">
                      <span className="font-bold text-amber-300">{log.action}</span>
                      <span>
                        {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '—'}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-300">
                      <span className="text-slate-500">Por: </span>
                      {log.actor_name || '—'}
                      {log.actor_role && (
                        <span className="ml-2 text-slate-500">({log.actor_role})</span>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 text-[10px] text-slate-400 bg-slate-950 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setLogTarget(null)}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
{/* MODAL: NOVA ROTA */}
      {routeModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Nova rota de coletor</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome do coletor *</label>
                <input
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Coletor Rossi"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Zona *</label>
                <input
                  value={routeZone}
                  onChange={(e) => setRouteZone(e.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Centro / Zona Norte"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={routeStatus}
                  onChange={(e) => setRouteStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="ativo">ativo</option>
                  <option value="inativo">inativo</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRouteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={savingRoute}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold disabled:opacity-50"
              >
                {savingRoute ? 'Salvando...' : 'Criar rota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}