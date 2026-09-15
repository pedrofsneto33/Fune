'use client';

// Extraido do page.tsx (L5128). TenantSettingsTab e self-contained.
// Diferente da 6g-1: aqui o componente NAO e modal — renderizado
// direto como pagina.

import React from 'react';
import { useRouter } from 'next/navigation';
import { TenantSettingsTab } from '@/components/tabs/TenantSettingsTab';

export default function ConfiguracoesPage() {
  const router = useRouter();
  return <TenantSettingsTab onClose={() => router.push('/')} />;
}
