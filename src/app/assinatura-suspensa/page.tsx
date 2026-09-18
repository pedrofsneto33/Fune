'use client';

import React from 'react';
import { AlertCircle, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5586988117925?text=' + encodeURIComponent('Olá, minha conta EternityOS está suspensa. Preciso regularizar.');

export default function AssinaturaSuspensaPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <div className="flex justify-center">
          <AlertCircle className="w-14 h-14 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Conta suspensa
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sua assinatura do EternityOS esta suspensa por falta de pagamento.
          Regularize para retomar o acesso completo ao sistema.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition"
        >
          <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
        </a>
        <p className="text-xs text-slate-500 dark:text-slate-500 pt-2">
          Depois de regularizar, faca login novamente.
        </p>
      </div>
    </div>
  );
}
