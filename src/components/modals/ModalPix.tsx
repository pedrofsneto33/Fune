'use client';

import React, { useState } from 'react';
import { QrCode, X, Copy, Check } from 'lucide-react';

interface ModalPixProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPixRow: any | null;
  pixPayload: { qrCode: string; copyPaste: string; txid: string } | null;
  pixLoading: boolean;
}

export function ModalPix({
  isOpen,
  onClose,
  selectedPixRow,
  pixPayload,
  pixLoading
}: ModalPixProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !selectedPixRow) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border border-emerald-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cobrança PIX</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs space-y-1">
          <p className="text-zinc-400">Titular: <strong className="text-slate-900 dark:text-white">{selectedPixRow.holder}</strong></p>
          <p className="text-zinc-400">Valor: <strong className="text-emerald-400">{selectedPixRow.amount}</strong></p>
        </div>

        {pixLoading ? (
          <div className="p-8 text-center text-zinc-400 text-xs animate-pulse">
            Gerando QR Code PIX...
          </div>
        ) : pixPayload ? (
          <div className="space-y-4 text-center">
            {pixPayload.qrCode && (
              <div className="flex justify-center p-3 bg-white rounded-xl max-w-[180px] mx-auto shadow-md">
                <img src={`data:image/png;base64,${pixPayload.qrCode}`} alt="QR Code PIX" className="w-full h-auto" />
              </div>
            )}

            {pixPayload.copyPaste && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pixPayload.copyPaste);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-white text-xs font-semibold transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'PIX Copiado!' : 'Copiar Chave PIX Copia e Cola'}</span>
              </button>
            )}
          </div>
        ) : null}

        <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}