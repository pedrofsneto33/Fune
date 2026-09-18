'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-3 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Algo deu errado</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          O erro foi registrado automaticamente. Se persistir, entre em contato pelo WhatsApp.
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
