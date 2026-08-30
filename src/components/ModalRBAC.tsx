'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const ROLES = [
  { value: 'attendant', label: 'Atendente / Recepção' },
  { value: 'driver', label: 'Motorista / Remoção' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'manager', label: 'Gerente Operacional' },
  { value: 'admin', label: 'Administrador' },
  { value: 'superadmin', label: 'Super Administrador' },
];

export function ModalRBAC({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('attendant');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/users/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (session?.access_token || ''),
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (res.ok) {
        alert('Permissão atualizada com sucesso!');
        onClose();
      } else {
        const j = await res.json();
        alert('Erro: ' + (j.error || 'Falha ao salvar permissão'));
      }
    } catch {
      alert('Erro de conexão ao atualizar permissão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0d111a] border border-slate-800 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
        <h3 className="font-bold text-sm text-blue-400 mb-4 flex items-center gap-2">
          <span>🛡️</span> Controle de Acesso e Papéis (RBAC)
        </h3>
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">E-mail do Colaborador:</label>
            <input
              type="email"
              required
              placeholder="funcionario@funeraria.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Cargo / Nível de Acesso:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white"
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 bg-slate-800 rounded-lg text-slate-300 font-semibold">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow">
              {loading ? 'Salvando...' : 'Salvar Permissão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
