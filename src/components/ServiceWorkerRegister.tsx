'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker (PWA offline) apenas em produção.
 * O sw.js cacheia assets estaticos; chamadas /api/ são sempre rede.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silencioso: PWA é progressivo, falha de registro não afeta o app
      });
    }
  }, []);

  return null;
}
