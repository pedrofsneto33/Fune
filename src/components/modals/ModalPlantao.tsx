'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  X,
  User,
  MapPin,
  Truck,
  Package,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  HelpCircle
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export interface ModalPlantaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Propriedades compatíveis com page.tsx
  payments?: any[];
  holders?: any[];
  selectedContract?: any | null;
  onSelectContract?: (contract: any) => void;
  vehicles?: any[];
  stockUrns?: any[];
  onConfirm?: () => Promise<void> | void;
  [key: string]: any;
}

export function ModalPlantao({
  isOpen,
  onClose,
  onSuccess,
  payments = [],
  holders = [],
  selectedContract,
  onSelectContract,
  vehicles = [],
  stockUrns = [],
  onConfirm,
  ...rest
}: ModalPlantaoProps) {
  const { currentTenant } = useTenant();

  const contractList = holders.length > 0 ? holders : payments;

  const [selectedContractId, setSelectedContractId] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [deathLocation, setDeathLocation] = useState('');
  const [deathAddress, setDeathAddress] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [odometerStart, setOdometerStart] = useState<number | string>('');
  const [selectedUrnId, setSelectedUrnId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Estados do Motor de Carências e Elegibilidade (P0.1)
  const [deathType, setDeathType] = useState<'natural' | 'acidental'>('natural');
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedContract) {
      const id = selectedContract.id || selectedContract.contract_id || '';
      setSelectedContractId(id);
      setDeceasedName(selectedContract.holder || selectedContract.full_name || '');
      setContactName(selectedContract.holder || selectedContract.full_name || '');
      setContactPhone(selectedContract.phone || '');
      if (id) checkEligibility(id, deathType);
    }
  }, [selectedContract]);

  // Auto-preencher odômetro inicial ao selecionar veículo
  useEffect(() => {
    if (selectedVehicleId) {
      const v = vehicles.find((item: any) => item.id === selectedVehicleId);
      if (v && v.odometer !== undefined) {
        setOdometerStart(v.odometer);
      }
    }
  }, [selectedVehicleId, vehicles]);

  // Checar Elegibilidade e Carência
  const checkEligibility = async (contractIdOrHolderId: string, currentDeathType: 'natural' | 'acidental') => {
    if (!contractIdOrHolderId) {
      setEligibilityData(null);
      return;
    }
    setEligibilityLoading(true);
    try {
      const res = await fetch('/api/contracts/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: contractIdOrHolderId,
          holder_id: contractIdOrHolderId,
          death_type: currentDeathType
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setEligibilityData(data.result);
      } else {
        setEligibilityData(null);
      }
    } catch {
      setEligibilityData(null);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleContractChange = (val: string) => {
    setSelectedContractId(val);
    const selected = contractList.find((h: any) => h.id === val || h.contract_id === val);
    if (selected) {
      setDeceasedName(selected.holder || selected.full_name || '');
      setContactName(selected.holder || selected.full_name || '');
      setContactPhone(selected.phone || '');
      if (onSelectContract) onSelectContract(selected);
    }
    checkEligibility(val, deathType);
  };

  const handleDeathTypeChange = (type: 'natural' | 'acidental') => {
    setDeathType(type);
    if (selectedContractId) {
      checkEligibility(selectedContractId, type);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (onConfirm) {
        await onConfirm();
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId);
      const selectedUrn = stockUrns.find((u: any) => u.id === selectedUrnId);

      const payload = {
        tenant_id: currentTenant?.id || 'matriz',
        contract_id: selectedContractId || null,
        deceased_name: deceasedName,
        death_type: deathType,
        death_location: deathLocation,
        death_address: deathAddress,
        vehicle_id: selectedVehicleId || null,
        vehicle_plate: selectedVehicle?.plate || null,
        driver_name: driverName,
        odometer_start: Number(odometerStart) || 0,
        urn_id: selectedUrnId || null,
        urn_model: selectedUrn?.model || selectedUrn?.name || null,
        contact_name: contactName,
        contact_phone: contactPhone,
        notes,
        eligibility_status: eligibilityData?.status || 'NAO_VALIDADO',
        exemption_fee: eligibilityData?.suggestedExemptionFee || 0
      };

      const res = await fetch('/api/stock/dispatch-deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar acionamento de plantão.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao abrir chamado de plantão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-base font-bold text-white">Acionamento de Plantão 24h & Óbito</h3>
              <p className="text-xs text-zinc-400">Abertura de OS, validação de carências e despacho de frota.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Seção 1: Contrato e Carência */}
          <div className="space-y-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Vincular Contrato / Associado Titular
              </label>
              <select
                value={selectedContractId}
                onChange={(e) => handleContractChange(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="">-- Atendimento Particular / Sem Contrato --</option>
                {contractList.map((h: any, idx: number) => (
                  <option key={idx} value={h.id || h.contract_id}>
                    {h.holder || h.full_name} - CPF: {h.cpf || 'S/N'} ({h.plan || 'Plano Padrão'})
                  </option>
                ))}
              </select>
            </div>

            {/* Alternador de Tipo de Óbito */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-zinc-400 font-medium text-[11px]">Tipo de Causa Mortis:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDeathTypeChange('natural')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                    deathType === 'natural'
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Morte Natural (90d carência)
                </button>
                <button
                  type="button"
                  onClick={() => handleDeathTypeChange('acidental')}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                    deathType === 'acidental'
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Morte Acidental (Isenta)
                </button>
              </div>
            </div>

            {/* Card de Validação de Carência e Elegibilidade */}
            {eligibilityLoading && (
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Auditando carências regulamentares e adimplência...</span>
              </div>
            )}

            {eligibilityData && !eligibilityLoading && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  eligibilityData.status === 'COBERTO'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : eligibilityData.status === 'INADIMPLENTE'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {eligibilityData.status === 'COBERTO' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : eligibilityData.status === 'INADIMPLENTE' ? (
                      <AlertOctagon className="w-4 h-4 text-red-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      {eligibilityData.status === 'COBERTO'
                        ? 'COBERTURA INTEGRAL APROVADA'
                        : eligibilityData.status === 'INADIMPLENTE'
                        ? 'BLOQUEIO POR INADIMPLÊNCIA'
                        : 'CARÊNCIA CONTRATUAL PENDENTE'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40">
                    {eligibilityData.daysActive} dias vigentes
                  </span>
                </div>
                <p className="text-[11px] opacity-90">{eligibilityData.reason}</p>
                {eligibilityData.suggestedExemptionFee > 0 && (
                  <div className="pt-1.5 border-t border-current/20 flex justify-between items-center text-[11px] font-semibold">
                    <span>
                      {eligibilityData.status === 'INADIMPLENTE'
                        ? 'Valor Total em Atraso:'
                        : 'Taxa Sugerida de Liberação / Coparticipação:'}
                    </span>
                    <span className="font-mono text-xs font-bold">
                      R$ {eligibilityData.suggestedExemptionFee.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seção 2: Dados do Falecido e Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Nome do Falecido *</label>
              <input
                type="text"
                required
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                placeholder="Nome completo do falecido"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Local do Óbito *</label>
              <input
                type="text"
                required
                value={deathLocation}
                onChange={(e) => setDeathLocation(e.target.value)}
                placeholder="Ex: Hospital Getúlio Vargas / Residência"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-zinc-300 font-semibold mb-1">Endereço do Local do Óbito / Remoção</label>
              <input
                type="text"
                value={deathAddress}
                onChange={(e) => setDeathAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Seção 3: Veículo, Motorista e Urna */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Veículo de Remoção</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Selecionar Veículo --</option>
                {vehicles.map((v: any, idx: number) => (
                  <option key={idx} value={v.id}>
                    {v.model || v.name} ({v.plate}) - {v.status || 'Disponível'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Motorista / Agente</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Nome do motorista"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Odômetro Inicial (KM)</label>
              <input
                type="number"
                value={odometerStart}
                onChange={(e) => setOdometerStart(e.target.value)}
                placeholder="Ex: 45000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Seção 4: Urna e Contato da Família */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Urna Funerária (Estoque)</label>
              <select
                value={selectedUrnId}
                onChange={(e) => setSelectedUrnId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Selecionar Urna --</option>
                {stockUrns.map((u: any, idx: number) => (
                  <option key={idx} value={u.id}>
                    {u.model || u.name} (Qtd: {u.quantity || u.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Familiar Responsável</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nome do solicitante"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Telefone do Familiar</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(86) 99999-9999"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Observações do Plantão</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de velório, translado ou documentação pendente..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !deceasedName || !deathLocation}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-600/20"
            >
              <PhoneCall className="w-4 h-4" />
              {loading ? 'Registrando...' : 'Despachar Plantão & Registrar OS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}