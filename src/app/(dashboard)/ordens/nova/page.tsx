// Formulario de nova OS. POST sera ligado em 4c-2b.
// Duplicacao temporaria de page.tsx. Resolvida na Fase 6.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';
import ItemsForm, {
  type FormInventoryItem,
  type OrdemItem,
  type OrdemItemField,
} from '@/components/forms/ItemsForm';
import ResponsavelForm from '@/components/forms/ResponsavelForm';

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

interface FormVehicle {
  id: string;
  plate: string;
  model: string;
  status: string;
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
  // 13a: responsavel avulso (venda de balcão) — apenas deceased_type === 'free'
  const [responsavelName, setResponsavelName] = useState('');
  const [responsavelCpf, setResponsavelCpf] = useState('');
  const [responsavelPhone, setResponsavelPhone] = useState('');
  const [responsavelEmail, setResponsavelEmail] = useState('');
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
  const handleItemChange = (idx: number, field: OrdemItemField, val: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
  };

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

  const handleSave = async () => {
    if (!validate()) return;
    if (saving) return;

    // deceased_id e obrigatorio pela API para todos os tipos
    let finalDeceasedId = deceasedId;
    if (deceasedType === 'free') {
      // free = sem titular; gera ID sintetico para satisfacer a API
      finalDeceasedId = crypto.randomUUID();
    } else if (!deceasedId) {
      notifyError('Selecione um titular antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        deceased_name: deceasedName.trim(),
        deceased_type: deceasedType,
        deceased_id: finalDeceasedId,
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
        ...(deceasedType === 'free' && responsavelName.trim()
          ? {
              responsavel_name: responsavelName.trim(),
              responsavel_cpf: responsavelCpf.trim() || undefined,
              responsavel_phone: responsavelPhone.trim() || undefined,
              responsavel_email: responsavelEmail.trim() || undefined,
            }
          : {}),
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

      {/* 13a: Responsável (cliente avulso) — só para 'Particular' */}
      {deceasedType === 'free' && (
        <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Responsável (quem contrata e paga — opcional)</h2>
          <ResponsavelForm
            values={{
              name: responsavelName,
              cpf: responsavelCpf,
              phone: responsavelPhone,
              email: responsavelEmail,
            }}
            onChange={(field, value) => {
              if (field === 'name') setResponsavelName(value);
              else if (field === 'cpf') setResponsavelCpf(value);
              else if (field === 'phone') setResponsavelPhone(value);
              else if (field === 'email') setResponsavelEmail(value);
            }}
            disabled={saving}
          />
        </section>
      )}

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
                    setDeceasedId(h.id);
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
      <ItemsForm
        items={items}
        inventoryList={inventoryList}
        onAdd={handleAddItem}
        onRemove={handleRemoveItem}
        onChange={handleItemChange}
        disabled={saving}
      />

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

