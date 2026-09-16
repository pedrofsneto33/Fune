'use client';

import { useEffect, useState } from 'react';

/**
 * Fase 8 — Hook responsivo genérico, SSR-safe.
 * Retorna `false` no servidor (sem window) e sincroniza com o breakpoint
 * via window.matchMedia — cleanup no unmount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}
