'use client';

// Extraido do page.tsx (L5123). ModalRBAC e self-contained.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { ModalRBAC } from '@/components/dashboard/ModalRBAC';

export default function UsuariosPage() {
  const [role, setRole] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/init-user', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        }
      } catch {
        // silencioso — backend ja bloqueia
      }
    })();
  }, []);

  return (
    <ModalRBAC
      isOpen={true}
      onClose={() => router.push('/')}
      currentRole={role}
    />
  );
}
