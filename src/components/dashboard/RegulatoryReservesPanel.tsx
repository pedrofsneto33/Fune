'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Scale, TrendingUp, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

interface ReserveData {
  referenceMonth: string;
  grossRevenue: number;
  netRevenue: number;
  solvencyTarget: number;
  technicalTarget: number;
  totalRequiredProvision: number;
  appliedAmount: number;
  status: string;
  regulatoryBasis: string;
}

export function RegulatoryReservesPanel() {
  const [data, setData] = useState<ReserveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/financial/regulatory-reserves')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm animate-pulse">
        Carregando cálculos atuariais e provisões legais...
      </div>
    );
  }

  if (!data) return null;

  const isCompliant = data.appliedAmount >= data.totalRequiredProvision;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
      {/* Cabeçalho do Dossiê */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Provisões e Reservas Regulatórias</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conformidade obrigatória com a <strong>Lei Federal 13.261/2016 (Art. 8º)</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCompliant ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              Provisão Regular
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Aporte Pendente
            </span>
          )}
        </div>
      </div>

      {/* Grid de Métricas Legais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Faturamento Bruto</span>
          <p className="text-lg font-bold text-white mt-1">
            R$ {data.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Base Solvência</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Receita Líquida</span>
          <p className="text-lg font-bold text-slate-200 mt-1">
            R$ {data.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Base Reserva Técnica</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Solvência (10%)</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">
            R$ {data.solvencyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-500/70 mt-0.5 block">Art. 8º, I - Títulos Públicos</span>
        </div>

        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/40">
          <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Reserva Técnica (12%)</span>
          <p className="text-lg font-bold text-cyan-400 mt-1">
            R$ {data.technicalTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-cyan-500/70 mt-0.5 block">Art. 8º, II - Garantia Atuarial</span>
        </div>
      </div>

      {/* Resumo Consolidado e Blindagem Fiscal */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400">Total Obrigatório a Segregar no Mês:</span>
          <p className="text-xl font-black text-white mt-0.5">
            R$ {data.totalRequiredProvision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Exportar Dossiê de Conformidade (PDF)</span>
        </button>
      </div>
    </div>
  );
}