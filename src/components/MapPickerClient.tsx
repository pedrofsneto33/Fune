'use client';

import dynamic from 'next/dynamic';

// Leaflet acessa window; precisa de ssr:false para nao quebrar
// durante renderizacao no servidor (Next 16 App Router).
export const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 400, width: '100%', background: '#e2e8f0', borderRadius: '0.5rem' }} />
  ),
});
