'use client';

// Portado do monolito (src/app/page.tsx L4858-4962) na fase 6g-5.
// Documento imprimivel: overlay + termo de adesao + Imprimir/Fechar.
// O conteudo carrega .print-target e os controles .no-print, casados com o
// bloco @media print de src/app/globals.css (a impressao sai so com o termo).
import type { Holder } from '@/types';

interface AdhesionTermProps {
  holder: Holder;
  onClose: () => void;
}

export default function AdhesionTerm({ holder, onClose }: AdhesionTermProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="print-target bg-white text-slate-900 rounded-xl max-w-2xl w-full p-8 shadow-2xl">
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold tracking-wider uppercase">
              ETERNITY OS - PLANO FUNERÁRIO
            </h2>
            <p className="text-xs text-slate-600">
              TERMO DE ADESÃO E CONTRATO DE PRESTAÇÃO DE SERVIÇOS FUNERÁRIOS
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">
              Contrato Nº {holder.id.substring(0, 8).toUpperCase()}
            </p>
            <p>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-slate-100 p-3 rounded">
            <p className="font-bold uppercase text-[11px] mb-1">
              1. DADOS DO TITULAR CONTRATANTE
            </p>
            <p>
              <strong>Nome:</strong> {holder.full_name}
            </p>
            <p>
              <strong>CPF:</strong> {holder.cpf} |{' '}
              <strong>Telefone:</strong> {holder.phone}
            </p>
            <p>
              <strong>Endereço:</strong> {holder.address || 'Não informado'}
            </p>
          </div>

          <div className="bg-slate-100 p-3 rounded">
            <p className="font-bold uppercase text-[11px] mb-1">
              2. DEPENDENTES COBERTOS ({holder.dependents?.length || 0})
            </p>
            {(holder.dependents || []).map((dep, idx) => (
              <p key={dep.id}>
                {idx + 1}. {dep.full_name} ({dep.relation})
              </p>
            ))}
            {(!holder.dependents || holder.dependents.length === 0) && (
              <p>Nenhum dependente adicional.</p>
            )}
          </div>

          <div className="bg-slate-100 p-3 rounded">
            <p className="font-bold uppercase text-[11px] mb-1">
              3. COBERTURAS INCLUSAS DO PLANO
            </p>
            <p>
              Urna fúnebre sextavada envernizada, ornamentação completa com véu
              e flores, preparação do corpo/higienização, sala de velório
              climatizada, cortejo fúnebre até o cemitério municipal e suporte
              administrativo para certidão de óbito.
            </p>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-300 mt-6">
            <div>
              <div className="border-t border-slate-900 pt-1">
                Assinatura do Titular Contratante
              </div>
              <p className="text-[10px] text-slate-600">{holder.full_name}</p>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1">
                Assinatura da Funerária / Administradora
              </div>
              <p className="text-[10px] text-slate-600">
                Eternity Assistência Familiar
              </p>
            </div>
          </div>
        </div>

        <div className="no-print mt-6 flex justify-end gap-2 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs"
          >
            Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow"
          >
            🖨️ Imprimir Termo
          </button>
        </div>
      </div>
    </div>
  );
}
