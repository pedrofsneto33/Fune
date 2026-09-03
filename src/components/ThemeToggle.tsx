'use client';

import { useEffect, useState } from 'react';

// ============================================================
// Alternador de Tema (claro/escuro) - persiste em localStorage
// ============================================================

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Sincroniza com o tema atual do <html>
    const current = document.documentElement.classList.contains('dark');
    setIsDark(current);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        aria-label="Alternar tema"
        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.5-6.5L15 6.4M9 17.6l-1.5 1.5m9 0L15 17.6M9 6.4L6.5 4.5M12 17a5 5 0 100-10 5 5 0 000 10z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 dark:text-slate-300 text-xs font-semibold transition-colors"
    >
      {isDark ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.5-6.5L15 6.4M9 17.6l-1.5 1.5m9 0L15 17.6M9 6.4L6.5 4.5M12 17a5 5 0 100-10 5 5 0 000 10z" />
          </svg>
          Tema Claro
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
          </svg>
          Tema Escuro
        </>
      )}
    </button>
  );
}