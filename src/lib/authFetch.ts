'use client';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch helper que injeta automaticamente o Bearer token da sessão atual.
 * Use em componentes cliente para chamar APIs protegidas por withAuth.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    if (!token) {
      // SECURITY (F-16): sessão ausente/corrompida → 401 imediato, SEM
      // reenviar o pedido anônimo (antes o catch reintentava sem token e
      // cada chamada degenerava numa chuva de 401 na UI).
      return new Response(
        JSON.stringify({
          error: 'Sessão expirada. Recarregue a página para iniciar sessão.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Sessão expirada. Recarregue a página para iniciar sessão.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
