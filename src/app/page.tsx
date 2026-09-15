'use client';

// HomeRedirect: substitui o monolito da home (Fase 6g-6d).
// Prioriza /executivo (dashboard com KPIs). Se o role nao tiver
// acesso, cai para a primeira rota permitida em NAV_GROUPS.

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

        // Prioridade: /executivo (dashboard com KPIs + grafico)
        if (isTabAllowed(data.role, 'executive')) {
          router.replace('/executivo');
          return;
        }

        // Fallback: primeira rota permitida em NAV_GROUPS
        for (const group of NAV_GROUPS) {
          for (const item of group.items) {
            if (isTabAllowed(data.role, item.tab)) {
              router.replace(item.href);
              return;
            }
          }
        }

        // Ultimo fallback
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