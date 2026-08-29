'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        // Redirecionamento direto e limpo
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setErrorMsg(
        err.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : err.message || 'Falha ao autenticar no Supabase.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Efeito Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00D1FF]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">SAAD<span className="text-[#00D1FF]"> FUNE</span></h1>
          <p className="text-xs text-zinc-400 mt-1">Acesso Restrito ao Painel Operacional</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">E-mail Operacional</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="operador@saadfune.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D1FF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Senha de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D1FF] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#0F62FE] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-950/40"
          >
            {loading ? 'Validando acesso...' : 'Entrar no Sistema'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-500">
            Ambiente Monitorado & Criptografado • EternityOS
          </p>
        </div>
      </div>
    </main>
  );
}