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

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });
  }
}