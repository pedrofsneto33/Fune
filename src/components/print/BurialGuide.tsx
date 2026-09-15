'use client';

// Portado do monolito (src/app/page.tsx L4964-5024) na fase 6g-5.
// Documento imprimivel: overlay + guia de atendimento/sepultamento.
// O conteudo carrega .print-target e os controles .no-print, casados com o
// bloco @media print de src/app/globals.css (a impressao sai so com a guia).
import type { Burial } from '@/types';

interface BurialGuideProps {
  burial: Burial;
  onClose: () => void;
}

export default function BurialGuide({ burial, onClose }: BurialGuideProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="print-target bg-white text-slate-900 rounded-xl max-w-xl w-full p-8 shadow-2xl">
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold uppercase">
              GUIA DE ATENDIMENTO E SEPULTAMENTO
            </h2>
            <p className="text-xs text-slate-600">
              ETERNITY OS - CENTRAL DE PLANTÃO 24H
            </p>
          </div>
          <p className="font-bold text-xs">
            Nº {burial.id.substring(0, 6).toUpperCase()}
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <p>
            <strong>Nome da Pessoa Falecida:</strong>{' '}
            {burial.deceased_name}
          </p>
          <p>
            <strong>Cemitério / Local Previsto:</strong>{' '}
            {burial.cemetery_location || 'A definir'}
          </p>
          <p>
            <strong>Data e Hora do Atendimento:</strong>{' '}
            {new Date(burial.burial_date).toLocaleString('pt-BR')}
          </p>
          <p>
            <strong>Status:</strong> {burial.status || 'Agendado'}
          </p>
          <div className="bg-slate-100 p-3 rounded mt-3">
            <p className="font-bold text-[11px] mb-1">
              Checklist de Liberação:
            </p>
            <p>[ x ] Urna Mortuária separada e preparada</p>
            <p>[ x ] Veículo de cortejo escalado</p>
            <p>[ x ] Ornamentação e véu florido inclusos</p>
          </div>
        </div>

        <div className="no-print mt-6 flex justify-end gap-2 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-semibold text-xs"
          >
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow"
          >
            🖨️ Imprimir Guia
          </button>
        </div>
      </div>
    </div>
  );
}
