"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Printer, Copy } from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notify";

// 12b-2: QR de rastreamento da OS. O QR aponta para a rota publica
// /track/[token] (12b-3) — enquanto ela nao existir, a URL abre 404.
// Impressao: @media print esconde tudo exceto .qr-print-area.
export function ModalQrOS({
  isOpen,
  onClose,
  token,
  deceasedName,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  deceasedName: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token) {
      setQrDataUrl(null);
      return;
    }
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/track/${token}`
        : "";
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch((err: unknown) => {
        notifyError("Erro ao gerar QR Code: " + (err as Error).message);
      });
  }, [isOpen, token]);

  if (!isOpen) return null;

  const url =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/track/${token}`
      : "";

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notifySuccess("URL copiada!");
    } catch {
      notifyError("Não foi possível copiar a URL.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* CSS de impressão: só .qr-print-area sai no papel */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .qr-print-area, .qr-print-area * { visibility: visible; }
          .qr-print-area {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full shadow-2xl text-slate-900 dark:text-white">
        {/* HEADER (fora da área de impressão) */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">QR Code de rastreamento</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA DE IMPRESSÃO */}
        <div className="qr-print-area p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Ordem de Serviço</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">{deceasedName}</p>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code de rastreamento" className="mx-auto rounded bg-white p-2" width={256} height={256} />
          ) : (
            <div className="w-64 h-64 mx-auto rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
              Gerando QR...
            </div>
          )}
          <p className="mt-3 text-[10px] text-slate-500">Escaneie para acompanhar o andamento do serviço.</p>
        </div>

        {/* RODAPÉ (fora da área de impressão) */}
        <div className="px-5 pb-5 space-y-2">
          <code className="block overflow-x-auto whitespace-nowrap bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-400">
            {url || "—"}
          </code>
          <div className="flex gap-2">
            <button
              onClick={copyUrl}
              disabled={!url}
              className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar URL
            </button>
            <button
              onClick={() => window.print()}
              disabled={!qrDataUrl}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}