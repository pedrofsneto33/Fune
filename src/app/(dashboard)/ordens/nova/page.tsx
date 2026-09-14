// Formulario de nova OS. POST sera ligado em 4c-2b.
// Duplicacao temporaria de page.tsx. Resolvida na Fase 6.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

interface FormHoldersQuick {
  id: string;
  full_name: string;
  cpf: string;
  status: string;
}

interface FormVehicle {
  id: string;
  plate: string;
  model: string;
  status: string;
}

interface FormInventoryItem {
  id: string;
  item_name: string;
  stock_quantity: number;
}

interface OrdemItem {
  inventory_id: string;
  quantity: number;
  unit_price: number;
}

export default function NovaOrdemPage() {
  const router = useRouter();

  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedType, setDeceasedType] = useState<'holder' | 'dependent' | 'free'>('holder');
  const [deceasedId, setDeceasedId] = useState('');
  const [contractId, setContractId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [burialDate, setBurialDate] = useState('');
  const [cemeteryLocation, setCemeteryLocation] = useState('');
      const [items, setItems] = useState<OrdemItem[]>([{ inventory_id: '', quantity: 1, unit_price: 0 }]);
  const [holdersQuickResults, setHoldersQuickResults] = useState<FormHoldersQuick[]>([]);
  const [holdersQuickQuery, setHoldersQuickQuery] = useState('');
  const [holdersQuickLoading, setHoldersQuickLoading] = useState(false);
    const [vehiclesDisponiveis, setVehiclesDisponiveis] = useState<FormVehicle[]>([]);
  const [inventoryList, setInventoryList] = useState<FormInventoryItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Busca titulares (debounce 500ms, min 3 chars)
  useEffect(() => {
    if (holdersQuickQuery.length < 3) {
      setHoldersQuickResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setHoldersQuickLoading(true);
      try {
        const res = await authFetch(`/api/holders/quick-search?q=${encodeURIComponent(holdersQuickQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (!data) setHoldersQuickResults([]);
          else setHoldersQuickResults(Array.isArray(data) ? data : []);
        }
      } catch {
        notifyError('Erro ao buscar titulares');
      } finally {
        setHoldersQuickLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [holdersQuickQuery]);

  // Carrega veículos disponíveis e inventário
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [vRes, iRes] = await Promise.all([
          authFetch('/api/vehicles'),
          authFetch('/api/inventory'),
        ]);
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehiclesDisponiveis(Array.isArray(vData) ? vData.filter((v: FormVehicle) => v.status === 'Disponível') : []);
        }
        if (iRes.ok) {
          const iData = await iRes.json();
          setInventoryList(Array.isArray(iData) ? iData : []);
        }
      } catch {
        notifyError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
    }, []);

  // Handlers
  const handleAddItem = () => setItems([...items, { inventory_id: '', quantity: 1, unit_price: 0 }]);
  const handleRemoveItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, field: 'inventory_id' | 'quantity' | 'unit_price', val: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
  };

  const subtotal = (it: OrdemItem) => (it.quantity || 0) * (it.unit_price || 0);
  const totalGeral = () => items.reduce((sum, it) => sum + subtotal(it), 0);

  const validate = () => {
    if (deceasedName.length < 3) {
      notifyError('Nome do falecido precisa de ao menos 3 caracteres');
      return false;
    }
    if (!burialDate) {
      notifyError('Data do sepultamento é obrigatória');
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.inventory_id && (!it.quantity || it.quantity <= 0)) {
        notifyError(`Quantidade inválida no item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const DEATH_TYPE_MAP = {
    holder: 'titular',
    dependent: 'dependente',
    free: 'particular',
  } as const;

  const handleSave = async () => {
    if (!validate()) return;
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        deceased_name: deceasedName.trim(),
        deceased_type: DEATH_TYPE_MAP[deceasedType],
        deceased_id: deceasedId || undefined,
        contract_id: contractId || undefined,
        vehicle_id: vehicleId || undefined,
        burial_date: burialDate,
        cemetery_location: cemeteryLocation.trim() || undefined,
        items: items
          .filter((it) => it.inventory_id)
          .map((it) => ({
            inventory_id: it.inventory_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
          })),
        notes: notes.trim() || undefined,
      };
      const res = await authFetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        notifySuccess('OS criada com sucesso.');
        router.push('/ordens');
      } else {
        const j = await res.json();
        notifyError('Erro: ' + (j.error || 'falha'));
      }
    } catch {
      notifyError('Erro de conexao.');
    } finally {
      setSaving(false);
    }
  };

    if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-bold text-slate-200">Nova Ordem de Serviço</h1>

      {/* 1. Falecido */}
      <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Falecido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Nome *</label>
            <input
              type="text"
              minLength={3}
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Tipo</label>
            <select
              value={deceasedType}
              onChange={(e) => setDeceasedType(e.target.value as 'holder' | 'dependent' | 'free')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="holder">Titular</option>
              <option value="dependent">Dependente</option>
              <option value="free">Particular</option>
            </select>
          </div>
          {deceasedType !== 'free' && (
            <div>
              <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">ID do associado</label>
              <input
                type="text"
                value={deceasedId}
                onChange={(e) => setDeceasedId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
                placeholder="UUID"
              />
            </div>
          )}
        </div>
            </section>

      {/* 2. Contrato (busca titular) */}
      <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Contrato (Titular)</h2>
        <div className="space-y-2">
          <input
            type="text"
            value={holdersQuickQuery}
            onChange={(e) => setHoldersQuickQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
            placeholder="CPF ou nome (mín 3 chars)"
          />
          {holdersQuickLoading && <p className="text-xs text-slate-500">Buscando...</p>}
          {holdersQuickResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-slate-800 rounded">
              {holdersQuickResults.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setContractId(h.id);
                    setHoldersQuickQuery('');
                    setHoldersQuickResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-semibold text-slate-200">{h.full_name}</span>
                  <span className="text-xs text-slate-500 block">{h.cpf}</span>
                </button>
              ))}
            </div>
          )}
          {contractId && (
            <p className="text-xs text-emerald-400">Contrato selecionado: {contractId.slice(0, 8)}...</p>
          )}
        </div>
      </section>

      {/* 3. Veículo */}
      <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Veículo (opcional)</h2>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
        >
          <option value="">Nenhum veículo</option>
          {vehiclesDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} — {v.model} ({v.status})
            </option>
          ))}
        </select>
      </section>

      {/* 4. Sepultamento */}
      <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Sepultamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Data *</label>
            <input
              type="date"
              value={burialDate}
              onChange={(e) => setBurialDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Cemitério</label>
            <input
              type="text"
              value={cemeteryLocation}
              onChange={(e) => setCemeteryLocation(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* 5. Itens (opcional) */}
      <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center justify-between">
          Itens (opcional)
          <button
            onClick={handleAddItem}
            className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-xs font-semibold hover:bg-emerald-900/60 transition"
          >
            + Adicionar item
          </button>
        </h2>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum item adicionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600 dark:text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 w-20">Qtde</th>
                  <th className="py-2 w-32">Preço unit.</th>
                  <th className="py-2 w-28">Subtotal</th>
                  <th className="py-2 w-16 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      <select
                        value={it.inventory_id}
                        onChange={(e) => handleItemChange(idx, 'inventory_id', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-sm text-slate-200"
                      >
                        <option value="">Selecione...</option>
                        {inventoryList.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} (estoque: {inv.stock_quantity})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-right text-slate-200"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={it.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-right text-slate-200"
                      />
                    </td>
                    <td className="py-2 text-emerald-300 font-semibold">
                      {subtotal(it).toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="px-2 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded text-xs hover:bg-rose-900/60 transition"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-3 text-right">
            <span className="text-xs text-slate-500">Total:</span>
            <span className="font-bold text-emerald-400 ml-2">{totalGeral().toFixed(2)}</span>
          </div>
        )}
      </section>

      {/* 6. Observações */}
      <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Observações</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-sm text-slate-900 dark:text-white"
          rows={4}
          placeholder="Observações sobre a ordem de serviço..."
        />
      </section>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/ordens')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded font-semibold transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar OS'}
        </button>
      </div>
    </div>
  );
}

