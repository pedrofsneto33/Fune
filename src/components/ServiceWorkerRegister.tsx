'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker (PWA offline) apenas em producao.
 * O sw.js cacheia assets estaticos; chamadas /api/ sao sempre rede.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silencioso: PWA é progressivo, falha de registro nao afeta o app
      });
    }
  }, []);

  return null;
}
