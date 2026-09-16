'use client';

// Fase 13c-2: wizard de venda avulsa (balcão) — 5 steps client-side que
// orquestra os 3 endpoints existentes na ordem OS -> Cobranca -> NF.
// Degradação graciosa: se Cobranca/NF falhar, a OS já existe e as pendências
// são resolvidas pelos botões 💰 Cobrar / 🧾 NF da listagem /ordens (12c-1/12c-2).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { notifySuccess, notifyError, notifyWarning } from '@/lib/notify';
import ItemsForm, {
  itemsTotal,
  type FormInventoryItem,
  type OrdemItem,
  type OrdemItemField,
} from '@/components/forms/ItemsForm';
import ResponsavelForm from '@/components/forms/ResponsavelForm';

const STEPS = ['Cliente', 'Falecido', 'Itens', 'Cobrança', 'Revisão'];

const todayPlus7 = () =>
  new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

export default function NovaVendaPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Step 1: cliente (responsável avulso)
  const [responsavelName, setResponsavelName] = useState('');
  const [responsavelCpf, setResponsavelCpf] = useState('');
  const [responsavelPhone, setResponsavelPhone] = useState('');
  const [responsavelEmail, setResponsavelEmail] = useState('');

  // Step 2: falecido
  const [deceasedName, setDeceasedName] = useState('');
  const [burialDate, setBurialDate] = useState('');

  // Step 3: itens
  const [items, setItems] = useState<OrdemItem[]>([{ inventory_id: '', quantity: 1, unit_price: 0 }]);
  const [inventoryList, setInventoryList] = useState<FormInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Step 4: cobrança
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO'>('PIX');
  const [dueDate, setDueDate] = useState(todayPlus7());

  // Step 5: NF
  const [emitNfse, setEmitNfse] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/inventory');
        if (res.ok) {
          const data = await res.json();
          setInventoryList(Array.isArray(data) ? data : []);
        }
      } catch {
        notifyError('Erro ao carregar estoque.');
      } finally {
        setLoadingInventory(false);
      }
    })();
  }, []);

  const cpfDigits = responsavelCpf.replace(/\D/g, '');
  const total = itemsTotal(items);

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (responsavelName.trim().length < 3)
        return 'Nome do responsável precisa de ao menos 3 caracteres.';
      if (cpfDigits.length !== 11) return 'CPF do responsável inválido (11 dígitos).';
    }
    if (s === 2 && deceasedName.trim().length < 3)
      return 'Nome do falecido precisa de ao menos 3 caracteres.';
    if (s === 3) {
      const validos = items.filter((it) => it.inventory_id && it.quantity > 0);
      if (validos.length === 0)
        return 'Adicione ao menos 1 item com estoque selecionado e quantidade válida.';
      if (items.some((it) => it.inventory_id && (!it.quantity || it.quantity <= 0)))
        return 'Há item com quantidade inválida.';
    }
    if (s === 4 && !dueDate) return 'Informe a data de vencimento da cobrança.';
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      notifyError(err);
      return;
    }
    setStep(Math.min(5, step + 1));
  };

  const handleItemChange = (idx: number, field: OrdemItemField, val: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // (a) Cria a OS free com o responsável persistido (13a)
      const osRes = await authFetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceased_name: deceasedName.trim(),
          deceased_type: 'free',
          deceased_id: crypto.randomUUID(),
          burial_date: burialDate || undefined,
          cemetery_location: '',
          notes: 'Venda avulsa via wizard /vendas/nova',
          items: items
            .filter((it) => it.inventory_id)
            .map((it) => ({
              inventory_id: it.inventory_id,
              quantity: it.quantity,
              unit_price: it.unit_price,
            })),
          responsavel_name: responsavelName.trim(),
          responsavel_cpf: cpfDigits,
          responsavel_phone: responsavelPhone.trim() || undefined,
          responsavel_email: responsavelEmail.trim() || undefined,
        }),
      });
      const osData = await osRes.json().catch(() => ({}));
      if (!osRes.ok) {
        notifyError('Erro ao criar a OS: ' + (osData.error || 'falha'));
        return;
      }
      const osId: string | undefined = osData?.service_order?.id;
      if (!osId) {
        notifyWarning('OS criada, mas sem ID retornado. Conclua cobrança/NF manualmente em /ordens.');
        router.push('/ordens');
        return;
      }

      // (d) Cobrança no Asaas (falha não desfaz a OS)
      const cobRes = await authFetch('/api/billing/avulso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel_nome: responsavelName.trim(),
          responsavel_cpf: cpfDigits,
          responsavel_phone: responsavelPhone.trim() || undefined,
          descricao: `Funeral de ${deceasedName.trim()}`,
          valor: total,
          vencimento: dueDate,
          billingType,
          service_order_id: osId,
        }),
      });
      if (!cobRes.ok) {
        const j = await cobRes.json().catch(() => ({}));
        notifyWarning('OS criada. Cobrança pendente (' + (j.error || 'falha') + ') — use o botão 💰 Cobrar em /ordens.');
      }

      // (e) NFS-e opcional (falha não desfaz a OS nem a cobrança)
      if (emitNfse) {
        const nfRes = await authFetch('/api/fiscal/emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_order_id: osId,
            taker: {
              documentType: 'cpf',
              document: cpfDigits,
              name: responsavelName.trim(),
              email: responsavelEmail.trim() || undefined,
              phone: responsavelPhone.trim() || undefined,
            },
            service: {
              description: `Serviço funerário — Funeral de ${deceasedName.trim()}`,
              amount: total,
            },
          }),
        });
        if (!nfRes.ok) {
          const j = await nfRes.json().catch(() => ({}));
          notifyWarning('OS criada. NF pendente (' + (j.error || 'falha') + ') — use o botão 🧾 NF em /ordens.');
        }
      }

      // (f) Sucesso
      notifySuccess('Venda registrada com sucesso!');
      router.push('/ordens');
    } catch {
      notifyError('Erro de conexão ao concluir a venda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold text-white">Nova Venda Avulsa</h1>
        <p className="text-xs text-slate-400 mt-1">
          Venda de balcão para cliente sem plano. Cria OS, cobra no Asaas e (opcional) emite NFS-e.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    current
                      ? 'bg-emerald-600 text-white'
                      : done
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {done ? '✓' : n}
                </span>
                <span className={`text-xs font-semibold ${current ? 'text-white' : 'text-slate-500'}`}>
                  {label}
                </span>
              </div>
              {n < STEPS.length && <div className="flex-1 h-px bg-slate-800" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Cliente */}
      {step === 1 && (
        <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300">1. Cliente (quem contrata e paga)</h2>
          <ResponsavelForm
            values={{ name: responsavelName, cpf: responsavelCpf, phone: responsavelPhone, email: responsavelEmail }}
            onChange={(field, value) => {
              if (field === 'name') setResponsavelName(value);
              else if (field === 'cpf') setResponsavelCpf(value);
              else if (field === 'phone') setResponsavelPhone(value);
              else if (field === 'email') setResponsavelEmail(value);
            }}
          />
        </section>
      )}

      {/* Step 2: Falecido */}
      {step === 2 && (
        <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">2. Falecido</h2>
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Nome do falecido *</label>
            <input
              type="text"
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Data do falecimento</label>
            <input
              type="date"
              value={burialDate}
              onChange={(e) => setBurialDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </section>
      )}

      {/* Step 3: Itens */}
      {step === 3 &&
        (loadingInventory ? (
          <p className="text-sm text-slate-400">Carregando estoque...</p>
        ) : (
          <ItemsForm
            items={items}
            inventoryList={inventoryList}
            onAdd={() => setItems([...items, { inventory_id: '', quantity: 1, unit_price: 0 }])}
            onRemove={(idx) => setItems(items.filter((_, i) => i !== idx))}
            onChange={handleItemChange}
          />
        ))}

      {/* Step 4: Cobrança */}
      {step === 4 && (
        <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300">4. Cobrança (Asaas)</h2>
            <span className="text-sm font-bold text-emerald-400">Total: R$ {total.toFixed(2)}</span>
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Forma de pagamento</label>
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value as 'PIX' | 'BOLETO')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm">Vencimento</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </section>
      )}

      {/* Step 5: Revisão */}
      {step === 5 && (
        <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-sm">
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300">5. Revisão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <p><span className="text-slate-500">Cliente:</span> <span className="text-slate-200">{responsavelName} (CPF {responsavelCpf})</span></p>
            {responsavelPhone && <p><span className="text-slate-500">Telefone:</span> <span className="text-slate-200">{responsavelPhone}</span></p>}
            <p><span className="text-slate-500">Falecido:</span> <span className="text-slate-200">{deceasedName}</span></p>
            {burialDate && <p><span className="text-slate-500">Falecimento:</span> <span className="text-slate-200">{new Date(burialDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span></p>}
            <p><span className="text-slate-500">Cobrança:</span> <span className="text-slate-200">{billingType} · vence {new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span></p>
            <p><span className="text-slate-500">Total:</span> <span className="font-bold text-emerald-400">R$ {total.toFixed(2)}</span></p>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Itens ({items.filter((it) => it.inventory_id).length}):</p>
            {items.filter((it) => it.inventory_id).map((it, i) => {
              const inv = inventoryList.find((v) => v.id === it.inventory_id);
              return (
                <p key={i} className="text-xs text-slate-300 ml-2">
                  {it.quantity}× {inv?.item_name || 'item'} — R$ {((it.quantity || 0) * (it.unit_price || 0)).toFixed(2)}
                </p>
              );
            })}
          </div>
          <label className="flex items-center gap-2 pt-2 border-t border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={emitNfse}
              onChange={(e) => setEmitNfse(e.target.checked)}
              className="accent-emerald-600"
            />
            <span className="text-xs text-slate-300">Emitir NFS-e agora (opcional)</span>
          </label>
        </section>
      )}

      {/* Navegação */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition disabled:opacity-50"
          >
            ← Anterior
          </button>
        )}
        {step < 5 ? (
          <button
            onClick={goNext}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition disabled:opacity-50"
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition disabled:opacity-50"
          >
            {saving ? 'Processando...' : '✓ Concluir venda'}
          </button>
        )}
      </div>
    </div>
  );
}
