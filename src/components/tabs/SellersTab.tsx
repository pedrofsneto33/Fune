'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Power, Trash2, Search, UserCheck, UserX, Phone, MessageCircle, Percent } from 'lucide-react';
import { notifySuccess, notifyError } from '@/lib/notify';
import { authFetch } from '@/lib/authFetch';

type Seller = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  commission_percent?: number | string | null;
  active: boolean;
  created_at?: string;
};

const fmtPercent = (v: number | string | null | undefined) => {
  const n = Number(v || 0);
  if (!isFinite(n)) return '0%';
  return `${n.toFixed(2).replace(/\.?0+$/, '')}%`;
};

export default function SellersTab() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<Seller | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', commission_percent: '0' });
  const [saving, setSaving] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await authFetch('/api/sellers');
      const j = await r.json();
      if (r.ok) {
        const list = Array.isArray(j) ? j : (j.sellers || []);
        setSellers(list);
      } else {
        notifyError('Erro ao carregar vendedores: ' + (j.error || 'desconhecido'));
      }
    } catch {
      notifyError('Erro de conexão ao carregar vendedores.');
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async () => {
    setLoadingCommissions(true);
    try {
      const r = await authFetch('/api/sales/commission');
      if (r.ok) {
        const j = await r.json();
        setCommissions(Array.isArray(j) ? j : (j.commissions || []));
      }
    } catch {
      // silencioso
    } finally {
      setLoadingCommissions(false);
    }
  };

  useEffect(() => { load(); loadCommissions(); }, []);

  const filtered = sellers
    .filter((s) => {
      if (statusFilter === 'active') return s.active;
      if (statusFilter === 'inactive') return !s.active;
      return true;
    })
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.whatsapp || '').toLowerCase().includes(q)
      );
    });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', phone: '', whatsapp: '', commission_percent: '0' });
    setShowForm(true);
  };

  const openEdit = (s: Seller) => {
    setEditing(s);
    setForm({
      name: s.name || '',
      phone: s.phone || '',
      whatsapp: s.whatsapp || '',
      commission_percent: String(Number(s.commission_percent || 0)),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      notifyError('Nome do vendedor é obrigatório (mín. 2 caracteres).');
      return;
    }
    const commission = Number(form.commission_percent);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      notifyError('Comissão deve estar entre 0 e 100.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        commission_percent: commission,
        active: true,
      };
      const body = editing ? { id: editing.id, ...payload } : payload;
      const r = await authFetch('/api/sellers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        notifyError('Erro ao salvar: ' + (j.error || 'falha desconhecida'));
        return;
      }
      notifySuccess(editing ? 'Vendedor atualizado!' : 'Vendedor cadastrado!');
      setShowForm(false);
      setEditing(null);
      await load();
    } catch {
      notifyError('Erro de conexão ao salvar vendedor.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Seller) => {
    try {
      const r = await authFetch('/api/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, active: !s.active }),
      });
      if (r.ok) {
        notifySuccess(s.active ? 'Vendedor inativado.' : 'Vendedor reativado.');
        await load();
      } else {
        const j = await r.json().catch(() => ({}));
        notifyError('Erro: ' + (j.error || 'falha'));
      }
    } catch {
      notifyError('Erro de conexão.');
    }
  };

  const remove = async (s: Seller) => {
    if (!confirm(`Excluir definitivamente o vendedor "${s.name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    try {
      const r = await authFetch(`/api/sellers?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' });
      if (r.ok) {
        notifySuccess('Vendedor excluído.');
        await load();
      } else {
        const j = await r.json().catch(() => ({}));
        notifyError('Erro: ' + (j.error || 'falha'));
      }
    } catch {
      notifyError('Erro de conexão.');
    }
  };

  const updateCommissionStatus = async (id: string, status: 'pendente' | 'pago' | 'estornado') => {
    try {
      const r = await authFetch('/api/sales/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (r.ok) {
        notifySuccess('Status atualizado.');
        await loadCommissions();
      } else {
        const j = await r.json().catch(() => ({}));
        notifyError('Erro: ' + (j.error || 'falha'));
      }
    } catch {
      notifyError('Erro de conexão.');
    }
  };

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <UserCheck size={18} className="text-cyan-400" />
            Vendedores & Comissões
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre sua equipe de vendas e acompanhe as comissões geradas.
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
        >
          <Plus size={14} /> Novo Vendedor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, telefone ou WhatsApp..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
        >
          <option value="all">Todos</option>
          <option value="active">Apenas ativos</option>
          <option value="inactive">Apenas inativos</option>
        </select>
      </div>
{/* PLACEHOLDER */}

      <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase">Equipe ({filtered.length})</h3>
          {loading && <span className="text-[10px] text-slate-500">carregando...</span>}
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            {sellers.length === 0
              ? 'Nenhum vendedor cadastrado ainda. Clique em "Novo Vendedor" para começar.'
              : 'Nenhum vendedor encontrado com os filtros atuais.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="text-left px-4 py-2">Nome</th>
                  <th className="text-left px-4 py-2">Contato</th>
                  <th className="text-right px-4 py-2">Comissão</th>
                  <th className="text-center px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                    <td className="px-4 py-2 font-semibold text-slate-100">{s.name}</td>
                    <td className="px-4 py-2 text-slate-400">
                      <div className="flex flex-col gap-0.5">
                        {s.phone && <span className="flex items-center gap-1 text-[10px]"><Phone size={10} /> {s.phone}</span>}
                        {s.whatsapp && <span className="flex items-center gap-1 text-[10px] text-emerald-400"><MessageCircle size={10} /> {s.whatsapp}</span>}
                        {!s.phone && !s.whatsapp && <span className="text-slate-600">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-cyan-400">{fmtPercent(s.commission_percent)}</td>
                    <td className="px-4 py-2 text-center">
                      {s.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-400"><UserCheck size={10} /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500"><UserX size={10} /> Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400" title="Editar"><Pencil size={12} /></button>
                        <button onClick={() => toggleActive(s)} className={`p-1.5 rounded ${s.active ? 'bg-slate-800 hover:bg-amber-700 text-amber-400' : 'bg-slate-800 hover:bg-emerald-700 text-emerald-400'}`} title={s.active ? 'Inativar' : 'Reativar'}><Power size={12} /></button>
                        <button onClick={() => remove(s)} className="p-1.5 rounded bg-slate-800 hover:bg-rose-700 text-rose-400" title="Excluir"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
{/* PLACEHOLDER2 */}

      <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Percent size={14} /> Comissões Registradas
          </h3>
          {loadingCommissions && <span className="text-[10px] text-slate-500">carregando...</span>}
        </div>
        {commissions.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500">
            Nenhuma comissão registrada até o momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="text-left px-4 py-2">Vendedor</th>
                  <th className="text-left px-4 py-2">Associado</th>
                  <th className="text-right px-4 py-2">Valor</th>
                  <th className="text-center px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                    <td className="px-4 py-2 font-semibold text-slate-100">{c.seller_name || '—'}</td>
                    <td className="px-4 py-2 text-slate-400">{c.contracts?.holders?.name || c.contracts?.holder_name || '—'}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-400">{fmtBRL(Number(c.amount) || 0)}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'pago' ? 'bg-emerald-900/40 text-emerald-400'
                          : c.status === 'estornado' ? 'bg-rose-900/40 text-rose-400'
                          : 'bg-amber-900/40 text-amber-400'
                        }`}
                      >
                        {c.status || 'pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        {c.status !== 'pago' && (
                          <button onClick={() => updateCommissionStatus(c.id, 'pago')} className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold" title="Marcar como pago">Pagar</button>
                        )}
                        {c.status !== 'estornado' && (
                          <button onClick={() => updateCommissionStatus(c.id, 'estornado')} className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold" title="Estornar">Estornar</button>
                        )}
                        {(c.status === 'pago' || c.status === 'estornado') && (
                          <button onClick={() => updateCommissionStatus(c.id, 'pendente')} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold" title="Reabrir">Reabrir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
{/* PLACEHOLDER3 */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2">
              {editing ? <Pencil size={14} /> : <Plus size={14} />}
              {editing ? 'Editar Vendedor' : 'Novo Vendedor'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="(00) 90000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Comissão padrão (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.commission_percent}
                  onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Percentual informativo do vendedor (referência). O cálculo real usa o percentual
                  configurado no plano vendido.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

