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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        alert('Permissão atualizada com sucesso!');
        onClose();
      } else {
        const j = await res.json();
        alert(`Erro: ${j.error || 'Falha ao salvar'}`);
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-white">
        <h3 className="font-bold text-sm mb-4">🛡️ Controle de Acesso (RBAC)</h3>
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <input
            type="email"
            required
            placeholder="E-mail do usuário..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 font-bold rounded">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
