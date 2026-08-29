'use client';
import React, { useState } from 'react';
import { X, Shield, UserCheck, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalRBAC({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('atendente');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('user_roles').upsert([
        { user_email: email, role: role }
      ], { onConflict: 'user_email' });

      if (error) throw error;
      alert(`Permissão de ${role.toUpperCase()} atribuída com sucesso para ${email}!`);
      setEmail('');
      onClose();
    } catch (err: any) {
      alert('Erro ao configurar permissão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" /> Controle de Acesso por Perfil (RBAC)
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSaveRole} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">E-mail do Colaborador</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colaborador@eternitysos.com" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nível de Permissão (Role)</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white">
              <option value="admin">Administrador (Acesso Total)</option>
              <option value="atendente">Atendente (Cadastro e Vendas)</option>
              <option value="plantao">Plantão 24h (Missões e Estoque)</option>
              <option value="cobrador">Cobrador (Rotas e Baixas PIX)</option>
            </select>
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition">
            {loading ? 'Salvando...' : 'Atribuir Perfil de Acesso'}
          </button>
        </form>
      </div>
    </div>
  );
}
