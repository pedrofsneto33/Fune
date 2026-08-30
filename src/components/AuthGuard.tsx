'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Permite livre acesso à página de login
    if (pathname === '/login') {
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

    // Ouve mudanças de estado de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== '/login') {
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

  if (!authenticated && pathname !== '/login') return null;

  return <>{children}</>;
}
