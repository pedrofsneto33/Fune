'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Public routes that don't require authentication
// Inclui /api/auth e /api/public por convenção (rotas públicas de API).
const PUBLIC_ROUTES = ['/login', '/landing', '/carteirinha', '/track', '/termos', '/privacidade', '/cookies', '/assinatura-suspensa', '/api/auth', '/api/public'];

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

// Early return para rotas públicas: nunca bloqueia nem busca sessão/permissão.
const isPublicPath = (pathname: string) =>
  ['/landing', '/privacidade', '/login'].some((r) => pathname.startsWith(r));

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Early return: rotas públicas passam direto, sem buscar sessão/permissão.
    if (isPublicPath(pathname) || isPublicRoute(pathname)) {
      setLoading(false);
      setAuthenticated(true);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/landing');
        } else {
          setAuthenticated(true);
        }
      } catch {
        // Falha ao consultar permissão: redireciona para /landing, nunca tela de erro.
        router.push('/landing');
        return;
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicRoute(pathname) && !isPublicPath(pathname)) {
        router.push('/landing');
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
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs font-mono animate-pulse">
        Verificando credenciais e permissões de acesso...
      </div>
    );
  }

  // Block access to protected routes if not authenticated
  if (!authenticated && !isPublicRoute(pathname)) return null;

  return <>{children}</>;
}
