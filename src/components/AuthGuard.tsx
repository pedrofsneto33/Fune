'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/landing'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow free access to public routes (login, landing page)
    if (PUBLIC_ROUTES.includes(pathname)) {
      setLoading(false);
      setAuthenticated(true);
      return;
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login');
      } else if (session) {
        setAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs font-mono animate-pulse">
        Verificando credenciais e permissões de acesso...
      </div>
    );
  }

  // Block access to protected routes if not authenticated
  if (!authenticated && !PUBLIC_ROUTES.includes(pathname)) return null;

  return <>{children}</>;
}
