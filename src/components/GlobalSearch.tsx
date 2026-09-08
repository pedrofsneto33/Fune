'use client';

import { useEffect, useMemo, useState } from 'react';

interface SearchHolder {
  id: string;
  full_name: string;
  cpf?: string;
  status?: string;
}
interface SearchBurial {
  id: string;
  deceased_name: string;
  status?: string;
}
interface SearchSO {
  id: string;
  deceased_name: string;
  status?: string;
}
interface SearchVehicle {
  id: string;
  model?: string;
  plate?: string;
  status?: string;
}

interface SearchItem {
  type: string;
  tab: string;
  label: string;
  sub?: string;
  query?: string;
}

/**
 * Busca global (Ctrl+K): acha associado, óbito, ordem de serviço ou veículo
 * a partir de qualquer aba e navega para a aba correspondente.
 */
export function GlobalSearch({
  open,
  onClose,
  holders,
  burials,
  serviceOrders,
  vehicles,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  holders: SearchHolder[];
  burials: SearchBurial[];
  serviceOrders: SearchSO[];
  vehicles: SearchVehicle[];
  onGo: (tab: string, query?: string) => void;
}) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = useMemo<SearchItem[]>(() => {
    if (!open) return [];
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const out: SearchItem[] = [];

    holders
      .filter(
        (h) =>
          h.full_name?.toLowerCase().includes(term) ||
          (h.cpf || '').replace(/\D/g, '').includes(term.replace(/\D/g, '')),
      )
      .slice(0, 5)
      .forEach((h) =>
        out.push({
          type: '👤 Associado',
          tab: 'holders',
          label: h.full_name,
          sub: h.cpf || undefined,
          query: h.full_name,
        }),
      );

    burials
      .filter((b) => b.deceased_name?.toLowerCase().includes(term))
      .slice(0, 4)
      .forEach((b) =>
        out.push({ type: '📋 Óbito', tab: 'burials', label: b.deceased_name, sub: b.status || 'Agendado' }),
      );

    serviceOrders
      .filter((s) => s.deceased_name?.toLowerCase().includes(term))
      .slice(0, 4)
      .forEach((s) =>
        out.push({ type: '🔗 Ordem de Serviço', tab: 'burials', label: s.deceased_name, sub: s.status }),
      );

    vehicles
      .filter(
        (v) =>
          (v.model || '').toLowerCase().includes(term) ||
          (v.plate || '').toLowerCase().includes(term),
      )
      .slice(0, 4)
      .forEach((v) =>
        out.push({
          type: '🚐 Veículo',
          tab: 'fleet',
          label: `${v.model || 'Veículo'} ${v.plate || ''}`.trim(),
          sub: v.status,
        }),
      );

    return out;
  }, [q, open, holders, burials, serviceOrders, vehicles]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="max-w-lg mx-auto mt-16 sm:mt-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar associado, óbito, OS ou veículo..."
          className="w-full bg-transparent px-4 py-4 text-sm text-slate-900 dark:text-white outline-none border-b border-zinc-200 dark:border-zinc-800 placeholder:text-zinc-600"
        />
        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/70">
          {q.trim().length < 2 && (
            <p className="px-4 py-6 text-xs text-zinc-500 text-center">
              Digite ao menos 2 caracteres para buscar em todas as abas…
            </p>
          )}
          {q.trim().length >= 2 && items.length === 0 && (
            <p className="px-4 py-6 text-xs text-zinc-500 text-center">
              Nada encontrado para “{q}”.
            </p>
          )}
          {items.map((it, i) => (
            <button
              key={`${it.tab}-${i}`}
              onClick={() => onGo(it.tab, it.query)}
              className="w-full text-left px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-800/60 flex items-center justify-between gap-3 transition"
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{it.label}</span>
              <span className="text-[10px] text-zinc-500 shrink-0">
                {it.type}
                {it.sub ? ` • ${it.sub}` : ''}
              </span>
            </button>
          ))}
        </div>
        <p className="px-4 py-2 text-[10px] text-zinc-600 border-t border-zinc-200 dark:border-zinc-800">
          Ctrl+K abre/fecha • ESC fecha • o resultado leva direto para a aba correspondente
        </p>
      </div>
    </div>
  );
}
