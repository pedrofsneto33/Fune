'use client';

import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';
import type { Dependent, Holder } from '@/types';

const VALID_RELATIONS = ['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Outro'];

export default function DependentesPage() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [selectedHolderId, setSelectedHolderId] = useState<string>('');
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRelation, setFormRelation] = useState(VALID_RELATIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/holders');
        if (res.ok) {
          const data = await res.json();
          setHolders(Array.isArray(data) ? data : []);
        }
      } catch {
        notifyError('Erro ao carregar titulares.');
      }
    })();
  }, []);

  const loadDependents = async (holderId: string) => {
    if (!holderId) {
      setDependents([]);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(
        '/api/dependents?holder_id=' + encodeURIComponent(holderId),
      );
      if (res.ok) {
        const data = await res.json();
        setDependents(Array.isArray(data.dependents) ? data.dependents : []);
      } else {
        const j = await res.json().catch(() => ({}));
        notifyError('Erro ao carregar dependentes: ' + (j.error || 'falha'));
        setDependents([]);
      }
    } catch {
      notifyError('Erro de conexao.');
      setDependents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependents(selectedHolderId);
  }, [selectedHolderId]);

  const openCreate = () => {
    if (!selectedHolderId) {
      notifyInfo('Selecione um titular primeiro.');
      return;
    }
    setEditingId(null);
    setFormName('');
    setFormRelation(VALID_RELATIONS[0]);
    setModalOpen(true);
  };

  const openEdit = (dep: Dependent) => {
    setEditingId(dep.id);
    setFormName(dep.full_name);
    setFormRelation(dep.relation);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (name.length < 3) {
      notifyError('Nome deve ter pelo menos 3 caracteres.');
      return;
    }
    if (!VALID_RELATIONS.includes(formRelation)) {
      notifyError('Parentesco invalido.');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const body = isEdit
        ? { id: editingId, full_name: name, relation: formRelation }
        : { holder_id: selectedHolderId, full_name: name, relation: formRelation };
      const res = await authFetch('/api/dependents', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        notifyError('Erro: ' + (j.error || 'falha'));
        return;
      }
      notifyInfo(isEdit ? 'Dependente atualizado.' : 'Dependente criado.');
      setModalOpen(false);
      await loadDependents(selectedHolderId);
    } catch {
      notifyError('Erro de conexao.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este dependente?')) return;
    try {
      const res = await authFetch(
        '/api/dependents?id=' + encodeURIComponent(id),
        { method: 'DELETE' },
      );
      if (res.ok) {
        notifyInfo('Dependente excluido.');
        await loadDependents(selectedHolderId);
      } else {
        const j = await res.json().catch(() => ({}));
        notifyError('Erro: ' + (j.error || 'falha'));
      }
    } catch {
      notifyError('Erro de conexao.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dependentes</h1>

      <div className="mb-4">
        <label className="block text-sm mb-1">Titular</label>
        <select
          value={selectedHolderId}
          onChange={(e) => setSelectedHolderId(e.target.value)}
          className="border rounded p-2 w-full max-w-md"
        >
          <option value="">Selecione um titular</option>
          {holders.map((h) => (
            <option key={h.id} value={h.id}>
              {h.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <button
          onClick={openCreate}
          disabled={!selectedHolderId}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          + Novo dependente
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : dependents.length === 0 ? (
        <p className="text-gray-500">
          {selectedHolderId ? 'Nenhum dependente.' : 'Selecione um titular.'}
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nome</th>
              <th className="text-left p-2">Parentesco</th>
              <th className="text-right p-2">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {dependents.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="p-2">{d.full_name}</td>
                <td className="p-2">{d.relation}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => openEdit(d)}
                    className="text-blue-600 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-red-600"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar' : 'Novo'} dependente
            </h2>
            <div className="mb-3">
              <label className="block text-sm mb-1">Nome completo</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="border rounded p-2 w-full"
                maxLength={255}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Parentesco</label>
              <select
                value={formRelation}
                onChange={(e) => setFormRelation(e.target.value)}
                className="border rounded p-2 w-full"
              >
                {VALID_RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 rounded border"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}