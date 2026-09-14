'use client';

// Extraido de page.tsx (~2808).
// Resolvido quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';
import type { Vehicle } from '@/types';

const VEHICLE_TYPES = ['Cortejo Fúnebre', 'Remoção Hospitalar', 'Apoio Familiar'];

const EMPTY_FORM = {
  plate: '',
  model: '',
  type: 'Cortejo Fúnebre',
  driver_name: '',
};

export default function FleetTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/vehicles');
      const data = await res.json().catch(() => []);
      if (res.ok) setVehicles(Array.isArray(data) ? data : []);
      else notifyError(data.error || 'Erro ao carregar veículos');
    } catch {
      notifyError('Erro de conexão ao carregar veículos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const toggleStatus = async (v: Vehicle) => {
    const newStatus = v.status === 'Disponível' ? 'Em Missão' : 'Disponível';
    try {
      const res = await authFetch('/api/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, status: newStatus }),
      });
      if (res.ok) {
        setVehicles((prev) => prev.map((item) => (item.id === v.id ? { ...item, status: newStatus } : item)));
      } else {
        const errData = await res.json().catch(() => ({}));
        notifyError(`Erro: ${errData.error || 'Falha ao alterar status'}`);
      }
    } catch {
      notifyError('Erro de conexão ao alterar status do veículo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este veículo da frota?')) return;
    const res = await authFetch(`/api/vehicles?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setVehicles((prev) => prev.filter((item) => item.id !== id));
      notifyInfo('Veículo removido.');
    } else {
      notifyError('Não foi possível remover o veículo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.model || form.model.trim().length < 2) {
      notifyError('Modelo do veículo é obrigatório (mínimo 2 caracteres).');
      return;
    }
    if (!form.plate || form.plate.trim().length < 7) {
      notifyError('Placa é obrigatória (mínimo 7 caracteres).');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newVeh = await res.json();
        setVehicles((prev) => [...prev, newVeh]);
        setIsNewOpen(false);
        setForm({ ...EMPTY_FORM });
        notifyInfo('Veículo cadastrado na frota!');
      } else {
        const err = await res.json();
        notifyError(`Erro: ${err.error || 'Falha ao salvar veículo'}`);
      }
    } catch {
      notifyError('Erro de conexão ao salvar veículo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Controle de Frota & Logística
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Veículos de cortejo, remoção e apoio familiar
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM });
            setIsNewOpen(true);
          }}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Veículo
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : vehicles.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum veículo cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-500 text-xs uppercase font-bold">
                  <span>{v.plate}</span>
                  <span className={v.status === 'Disponível' ? 'text-emerald-400' : 'text-amber-400'}>
                    {v.status === 'Disponível' ? '🟢' : '🟡'} {v.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">{v.model}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">Tipo: {v.type}</p>
                <p className="text-xs text-blue-400 mt-1">Motorista: {v.driver_name}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => toggleStatus(v)}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[11px]"
                >
                  Mudar Status
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-bold text-sm text-blue-400 mb-4">+ Cadastrar Novo Veículo</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Modelo do Veículo:
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="ex: Mercedes Vito Cortejo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                    Placa:
                  </label>
                  <input
                    type="text"
                    value={form.plate}
                    onChange={(e) => setForm({ ...form, plate: e.target.value })}
                    placeholder="PI-XXX-0000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                    Tipo:
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Motorista Responsável:
                </label>
                <input
                  type="text"
                  value={form.driver_name}
                  onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                  placeholder="Nome do motorista..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 font-bold rounded text-white disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}