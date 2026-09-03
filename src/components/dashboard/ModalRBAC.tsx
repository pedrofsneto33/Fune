'use client';import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';

import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, Edit2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  email?: string;
}

export function ModalRBAC({ isOpen, onClose, currentRole = 'admin' }: { isOpen: boolean; onClose: () => void; currentRole?: string }) {
  const isSuper = currentRole === 'superadmin';
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    if (isOpen) loadRoles();
  }, [isOpen]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/users/roles');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body && body.error) || `Erro ao carregar (${res.status})`);
      }
      const list = Array.isArray(body) ? body : body && Array.isArray(body.roles) ? body.roles : [];
      if (body && body.current_user_id) setCurrentUserId(body.current_user_id);
      setRoles(list);
    } catch (err: any) {
      console.error('Erro ao carregar roles:', err);
      notifyError('Erro ao carregar acessos: ' + (err.message || 'tente novamente.'));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/api/users/roles', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body && body.error) || 'Erro ao adicionar');
      }
      setEmail('');
      loadRoles();
    } catch (err: any) {
      notifyError('Erro: ' + (err.message || 'Não foi possível adicionar o acesso.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Remover este acesso?')) return;
    try {
      const res = await authFetch(`/api/users/roles?id=${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body && body.error) || 'Erro ao remover');
      }
      loadRoles();
    } catch (err: any) {
      notifyError('Erro: ' + (err.message || 'Não foi possível remover o acesso.'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Controle de Acesso (RBAC)</h2>
              <p className="text-xs text-zinc-400">Gerenciar permissões de usuários</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <form onSubmit={handleAddRole} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">E-mail do Usuário</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@empresa.com" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Permissão</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white">
                <option value="admin">Administrador</option>
                <option value="manager">Gerente</option>
                <option value="financial">Financeiro</option>
                <option value="attendant">Atendente</option>
                {isSuper && <option value="superadmin">Super Administrador (Dono)</option>}
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 h-[34px]">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </form>
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Usuários com Acesso</h3>
            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-500 animate-pulse">Carregando...</div>
            ) : roles.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">Nenhum usuário vinculado.</div>
            ) : (
              roles.map(r => {
                const isSelf = r.user_id === currentUserId;
                const isSuperRow = r.role === 'superadmin';
                const canDelete = !isSelf && (isSuper ? true : !isSuperRow);
                return (
                  <div key={r.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white font-bold">{r.email || r.user_id} {isSelf && <span className="ml-1 text-emerald-400 font-bold">(voce)</span>}</span>
                      <span className={`ml-2 px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-[10px] font-bold uppercase ${isSuperRow ? 'bg-amber-500/10 text-amber-400' : ''}`}>{r.role}{isSuperRow && ' (Dono)'}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRole(r.id)}
                      disabled={!canDelete}
                      title={isSelf ? 'Voce nao pode remover seu proprio acesso' : !canDelete ? 'Apenas Super Admin gerencia Super Admin' : 'Remover acesso'}
                      className={`p-1.5 rounded-lg transition ${canDelete ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-700 cursor-not-allowed'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition">Fechar</button>
        </div>
      </div>
    </div>
  );
}
