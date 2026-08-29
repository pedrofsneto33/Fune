'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  FileCheck,
  User,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export function ThanatopraxyTab() {
  const { currentTenant } = useTenant();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [selectedRecordForPrint, setSelectedRecordForPrint] = useState<any | null>(null);

  // Form states
  const [deceasedName, setDeceasedName] = useState('');
  const [deathCause, setDeathCause] = useState('');
  const [thanatopractorName, setThanatopractorName] = useState('');
  const [thanatopractorRegister, setThanatopractorRegister] = useState('');
  const [method, setMethod] = useState('Tanatopraxia Nível II (Padrão)');
  const [bodyCondition, setBodyCondition] = useState('Normal');
  const [arterialFluid, setArterialFluid] = useState('1000');
  const [cavityFluid, setCavityFluid] = useState('500');
  const [validityHours, setValidityHours] = useState('48');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/thanatopraxy?tenant_id=${currentTenant?.id || 'matriz'}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [currentTenant]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/thanatopraxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id || 'matriz',
          deceased_name: deceasedName,
          death_cause: deathCause,
          thanatopractor_name: thanatopractorName,
          thanatopractor_register: thanatopractorRegister,
          method,
          body_condition: bodyCondition,
          arterial_fluid_ml: Number(arterialFluid),
          cavity_fluid_ml: Number(cavityFluid),
          preservation_validity_hours: Number(validityHours),
          observations
        })
      });
      if (res.ok) {
        setIsNewRecordOpen(false);
        // Reset form
        setDeceasedName('');
        setDeathCause('');
        setThanatopractorName('');
        setThanatopractorRegister('');
        setObservations('');
        loadRecords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter((r) =>
    (r.deceased_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.thanatopractor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Laboratório de Tanatopraxia & Somatoconservação</h2>
            <p className="text-xs text-zinc-400">Controle sanitário, laudos de conservação e consumo de reagentes.</p>
          </div>
        </div>

        <button
          onClick={() => setIsNewRecordOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-600/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Ficha Técnica
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar falecido ou tanatopractor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Tabela de Prontuários */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Falecido / Data</th>
              <th className="py-3 px-4">Método / Validade</th>
              <th className="py-3 px-4">Tanatopractor / Registro</th>
              <th className="py-3 px-4">Químicos Utilizados</th>
              <th className="py-3 px-4 text-right">Declaração</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                  Nenhum procedimento de tanatopraxia registrado.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{r.deceased_name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(r.procedure_date).toLocaleString('pt-BR')}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-teal-300 block">{r.method}</span>
                    <span className="text-[10px] text-zinc-400">Garantia: {r.preservation_validity_hours} horas</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{r.thanatopractor_name}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">Reg: {r.thanatopractor_register || 'S/N'}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                    <p>Arterial: {r.arterial_fluid_ml} mL</p>
                    <p className="text-zinc-400">Cavitário: {r.cavity_fluid_ml} mL</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedRecordForPrint(r)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Ata Sanitária
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Ficha Técnica */}
      {isNewRecordOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Prontuário de Somatoconservação</h3>
              </div>
              <button onClick={() => setIsNewRecordOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">Nome do Falecido *</label>
                  <input
                    type="text"
                    required
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Causa Mortis (Declaração de Óbito)</label>
                  <input
                    type="text"
                    value={deathCause}
                    onChange={(e) => setDeathCause(e.target.value)}
                    placeholder="Ex: Parada Cardiorrespiratória"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Condição Inicial do Corpo</label>
                  <select
                    value={bodyCondition}
                    onChange={(e) => setBodyCondition(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Normal">Normal / Sem alterações</option>
                    <option value="Autópsia (IML/SVO)">Necropsiado (IML/SVO)</option>
                    <option value="Icterícia">Icterícia acentuada</option>
                    <option value="Edema / Anasarca">Edematoso / Anasarca</option>
                    <option value="Decomposição Inicial">Início de Decomposição</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Tanatopractor Responsável *</label>
                  <input
                    type="text"
                    required
                    value={thanatopractorName}
                    onChange={(e) => setThanatopractorName(e.target.value)}
                    placeholder="Nome do profissional"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Registro / Certificado Profissional</label>
                  <input
                    type="text"
                    value={thanatopractorRegister}
                    onChange={(e) => setThanatopractorRegister(e.target.value)}
                    placeholder="Ex: ABT-1234 / CRF"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Técnica / Método Aplicado *</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Tanatopraxia Nível I (Higienização + Tamponamento)">Tanatopraxia Nível I (Leve)</option>
                    <option value="Tanatopraxia Nível II (Padrão)">Tanatopraxia Nível II (Padrão 24-48h)</option>
                    <option value="Tanatopraxia Nível III (Avançada/Necropsiado)">Tanatopraxia Nível III (Avançada 72h+)</option>
                    <option value="Embalsamamento (Translado Aéreo/Longa Distância)">Embalsamamento (Aéreo/Longa Distância)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Garantia Sanitária (Horas)</label>
                  <input
                    type="number"
                    value={validityHours}
                    onChange={(e) => setValidityHours(e.target.value)}
                    placeholder="Ex: 48"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Fluido Arterial (mL)</label>
                  <input
                    type="number"
                    value={arterialFluid}
                    onChange={(e) => setArterialFluid(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Fluido Cavitário (mL)</label>
                  <input
                    type="number"
                    value={cavityFluid}
                    onChange={(e) => setCavityFluid(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Observações Técnicas do Laboratório</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Incidência de drenagem venosa, cosmética facial, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewRecordOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !deceasedName || !thanatopractorName}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Gravando...' : 'Salvar Prontuário & Emitir Ata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Impressão da Ata Sanitária de Conservação */}
      {selectedRecordForPrint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Declaração Sanitária de Somatoconservação</h3>
              <button onClick={() => setSelectedRecordForPrint(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {/* Documento Imprimível */}
            <div id="print-sanitary-cert" className="bg-white text-zinc-900 p-6 rounded-xl space-y-4 font-serif text-xs border border-zinc-300 shadow-inner">
              <div className="text-center pb-3 border-b border-zinc-400">
                <h2 className="text-base font-bold uppercase tracking-wider">{currentTenant?.name || 'ETERNITY SOS - SERVIÇOS FUNERÁRIOS'}</h2>
                <p className="text-[10px] text-zinc-600 uppercase">Laboratório de Tanatopraxia e Somatoconservação Cadavérica</p>
                <p className="text-[10px] text-zinc-600">Alvará Sanitário Regulamentar • CNPJ: {currentTenant?.cnpj || '43.210.987/0001-54'}</p>
              </div>

              <div className="text-center font-bold text-sm tracking-wide uppercase pt-2">
                ATA / DECLARAÇÃO DE CONSERVAÇÃO CADAVÉRICA
              </div>

              <p className="leading-relaxed text-justify">
                Declaramos para os devidos fins de direito e comprovação perante a <strong>Vigilância Sanitária</strong> e autoridades competentes para traslado terrestre e/ou aéreo, que o corpo de <strong>{selectedRecordForPrint.deceased_name}</strong>, falecido(a) em decorrência de <em>{selectedRecordForPrint.death_cause || 'Causa Natural'}</em>, foi devidamente submetido ao procedimento técnico-científico de <strong>{selectedRecordForPrint.method}</strong>, em conformidade com as normas sanitárias vigentes.
              </p>

              <div className="bg-zinc-100 p-3 rounded border border-zinc-300 space-y-1 text-[11px] font-mono">
                <p>• Data do Procedimento: {new Date(selectedRecordForPrint.procedure_date).toLocaleString('pt-BR')}</p>
                <p>• Garantia Sanitária de Conservação: {selectedRecordForPrint.preservation_validity_hours} horas</p>
                <p>• Fluidos Químicos Arteriais / Cavitários: {selectedRecordForPrint.arterial_fluid_ml} mL / {selectedRecordForPrint.cavity_fluid_ml} mL</p>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-4 text-center">
                <div className="border-t border-zinc-800 pt-1">
                  <p className="font-bold">{selectedRecordForPrint.thanatopractor_name}</p>
                  <p className="text-[10px] text-zinc-600">Tanatopractor Responsável (Reg: {selectedRecordForPrint.thanatopractor_register || 'Ativo'})</p>
                </div>
                <div className="border-t border-zinc-800 pt-1">
                  <p className="font-bold">Responsável Técnico / Diretor</p>
                  <p className="text-[10px] text-zinc-600">{currentTenant?.name || 'Eternity SOS'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedRecordForPrint(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir Declaração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}