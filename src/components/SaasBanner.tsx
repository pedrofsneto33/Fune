'use client';

import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface SaasBannerProps {
  status: 'past_due' | 'suspended';
}

const WHATSAPP_URL = 'https://wa.me/5586988117925?text=' + encodeURIComponent('Olá, preciso regularizar minha assinatura EternityOS.');

export function SaasBanner({ status }: SaasBannerProps) {
  const isSuspended = status === 'suspended';
  const bg = isSuspended
    ? 'bg-red-500/15 border-red-500/40 text-red-200'
    : 'bg-amber-500/15 border-amber-500/40 text-amber-200';
  const Icon = isSuspended ? AlertCircle : AlertTriangle;
  const msg = isSuspended
    ? 'Assinatura suspensa. Sua conta esta em modo SOMENTE LEITURA. Regularize para voltar a criar/editar.'
    : 'Sua assinatura esta com pagamento pendente. Regularize para evitar suspensao.';
  return (
    <div className={`border-b px-4 py-2.5 text-xs flex items-center gap-2 ${bg}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{msg}</span>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="font-bold underline hover:no-underline whitespace-nowrap"
      >
        Regularizar
      </a>
    </div>
  );
}

export default SaasBanner;
