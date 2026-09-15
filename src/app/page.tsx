'use client';

// HomeRedirect: substitui o monolito da home (Fase 6g-6d).
// Redireciona o usuario para a primeira rota permitida pelo seu role,
// baseado em NAV_GROUPS + isTabAllowed.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { NAV_GROUPS } from '@/app/(dashboard)/layout';
import { isTabAllowed } from '@/config/permissions';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/init-user', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.role) {
          router.replace('/login');
          return;
        }
        // Encontrar primeira rota permitida na ordem de NAV_GROUPS
        for (const group of NAV_GROUPS) {
          for (const item of group.items) {
            if (isTabAllowed(data.role, item.tab)) {
              router.replace(item.href);
              return;
            }
          }
        }
        // Fallback
        router.replace('/titulares');
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-400">Redirecionando...</p>
    </div>
  );
}
