'use client';

import { useState } from 'react';

/**
 * Formulário de captura de leads da landing (POST /api/leads/landing → CRM).
 *
 * Único pedaço interativo da landing: existe como client component isolado para
 * que src/app/landing/page.tsx possa ser Server Component estático (SEO + TTFB),
 * sem <AuthGuard> e sem tela de "Verificando credenciais...".
 */
export default function LeadForm() {
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    city: '',
    company: '',
    website: '',
  });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [leadError, setLeadError] = useState('');

  if (leadStatus === 'sent') {
    return (
      <p className="text-center text-emerald-400 font-bold text-sm bg-emerald-950/40 border border-emerald-800 rounded-xl p-5">
        ✅ Recebido! Retornaremos em breve pelo WhatsApp.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLeadStatus('sending');
        setLeadError('');
        try {
          const res = await fetch('/api/leads/landing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadForm),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setLeadError(data.error || 'Erro ao enviar.');
            setLeadStatus('error');
            return;
          }
          setLeadStatus('sent');
        } catch {
          setLeadError('Erro de conexão.');
          setLeadStatus('error');
        }
      }}
      className="bg-white/[0.02] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 text-xs"
    >
      <input
        value={leadForm.name}
        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
        required
        placeholder="Seu nome *"
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={leadForm.phone}
          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
          required
          placeholder="WhatsApp com DDD *"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
        />
        <input
          value={leadForm.city}
          onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
          placeholder="Cidade"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
        />
      </div>
      <input
        value={leadForm.company}
        onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
        placeholder="Nome da funerária (opcional)"
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
      />
      {/* honeypot anti-bot: invisível para humanos */}
      <input
        tabIndex={-1}
        autoComplete="off"
        value={leadForm.website}
        onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
        className="hidden"
        aria-hidden="true"
      />
      {leadStatus === 'error' && <p className="text-rose-400 text-[11px]">{leadError}</p>}
      <button
        disabled={leadStatus === 'sending'}
        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
      >
        {leadStatus === 'sending' ? 'Enviando...' : 'Quero uma demonstração gratuita'}
      </button>
    </form>
  );
}
