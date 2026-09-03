'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar e-mail de recuperacao.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Eternity OS</h1>
          <p className="text-xs text-zinc-400">Acesse o ERP com suas credenciais corporativas</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium">
            E-mail de recuperacao enviado! Verifique sua caixa de entrada e o spam.
          </div>
        )}

        <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eternitysos.com"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {!resetMode && (
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">Senha de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {resetMode
              ? (loading ? 'Enviando...' : 'Enviar Link de Recuperacao')
              : (loading ? 'Validando Acesso...' : 'Entrar no Sistema')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setResetMode(!resetMode); setError(''); setResetSent(false); }}
            className="text-[11px] text-blue-400 hover:text-blue-300 underline"
          >
            {resetMode ? 'Voltar para o login' : 'Esqueci minha senha'}
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <span className="text-[11px] text-zinc-500">
            Protegido por criptografia de sessão e controle RBAC.
          </span>
        </div>

      </div>
    </div>
  );
}

