'use client';

import dynamic from 'next/dynamic';

export const BurialsMap = dynamic(() => import('./BurialsMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 500, width: '100%', background: '#e2e8f0', borderRadius: '0.5rem' }} />
  ),
});
