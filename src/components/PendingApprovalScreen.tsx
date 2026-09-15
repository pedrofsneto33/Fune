'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// F-08 fail-closed: usuario autenticado mas sem role em nenhum tenant.
// Portado do monolito (src/app/page.tsx ~l.1702, bloco "Acesso pendente de
// aprovação") para a 6g-4, agora renderizado pelo (dashboard)/layout.tsx.
// Nao renderiza o dashboard: o shell era mostrado com tudo falhando em 403
// (withAuth devolve PENDING_APPROVAL) e sem nenhum link na nav.
export default function PendingApprovalScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Acesso pendente de aprovação
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Sua conta foi autenticada, mas ainda não está vinculada a nenhuma
          funerária. Solicite a um administrador que conceda seu acesso em
          Usuários &amp; Permissões.
        </p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-bold disabled:opacity-50"
        >
          {signingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </div>
  );
}
