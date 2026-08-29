'use client';

import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Building2, ChevronDown, Plus, ShieldCheck, X, Check, Phone, MapPin, Scale } from 'lucide-react';

export function TenantSwitcher() {
  const { tenants, currentTenant, setCurrentTenant, refreshTenants } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phoneEmergency, setPhoneEmergency] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuanceCity, setIssuanceCity] = useState('');
  const [technicalManager, setTechnicalManager] = useState('');
  const [error, setError] = useState('');

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          trade_name: tradeName,
          cnpj,
          phone_emergency: phoneEmergency,
          municipal_license_number: licenseNumber,
          issuance_city: issuanceCity,
          technical_manager: technicalManager
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao cadastrar empresa.');
      }

      await refreshTenants();
      setIsModalOpen(false);
      setName('');
      setTradeName('');
      setCnpj('');
      setPhoneEmergency('');
      setLicenseNumber('');
      setIssuanceCity('');
      setTechnicalManager('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Botão Seletor no Topo da Sidebar */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition text-left cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {currentTenant?.trade_name || 'Carregando...'}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                {currentTenant?.issuance_city ? `${currentTenant.issuance_city}` : 'Empresa Ativa'}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown de Alternância */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Alternar Unidade / Funerária
            </div>

            {tenants.map((t) => {
              const isSelected = t.id === currentTenant?.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTenant(t);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-semibold'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <span className="truncate">{t.trade_name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}

            <div className="pt-1 border-t border-zinc-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Unidade Funerária</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cadastrar Nova Unidade Funerária</h3>
                  <p className="text-xs text-zinc-400">Configuração Multi-Tenant e Conformidade Legal</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pax Memorial Piauí"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pax Memorial Ltda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Plantão 24h (Telefone)</label>
                  <input
                    type="text"
                    placeholder="(86) 99999-9999"
                    value={phoneEmergency}
                    onChange={(e) => setPhoneEmergency(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bloco Regulatório Lei 13.261/2016 */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Enquadramento Lei 13.261/2016 (Credenciamento Municipal)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Nº Alvará / Concessão</label>
                    <input
                      type="text"
                      placeholder="ALV-2026/089"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Cidade / UF</label>
                    <input
                      type="text"
                      placeholder="Teresina - PI"
                      value={issuanceCity}
                      onChange={(e) => setIssuanceCity(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Responsável Técnico</label>
                    <input
                      type="text"
                      placeholder="Diretor Técnico"
                      value={technicalManager}
                      onChange={(e) => setTechnicalManager(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Cadastrar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}