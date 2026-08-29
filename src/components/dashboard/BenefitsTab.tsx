'use client';

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  Percent,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export function BenefitsTab() {
  const { currentTenant } = useTenant();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modais
  const [isNewPartnerOpen, setIsNewPartnerOpen] = useState(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState(false);

  // Form states - Novo Parceiro
  const [partnerName, setPartnerName] = useState('');
  const [category, setCategory] = useState('Clínica Médica');
  const [discountDesc, setDiscountDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Teresina - PI');
  const [submitting, setSubmitting] = useState(false);

  // Validador de Carteirinha em Tempo Real
  const [verifyCpf, setVerifyCpf] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/benefits/partners?tenant_id=${currentTenant?.id || 'matriz'}`);
      const data = await res.json();
      setPartners(data.partners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [currentTenant]);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/benefits/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id || 'matriz',
          name: partnerName,
          category,
          discount_description: discountDesc,
          phone,
          address,
          city
        })
      });

      if (res.ok) {
        setIsNewPartnerOpen(false);
        setPartnerName('');
        setDiscountDesc('');
        setPhone('');
        setAddress('');
        loadPartners();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCpf) return;
    setVerifying(true);
    setVerificationResult(null);

    try {
      const clean = verifyCpf.replace(/\D/g, '');
      const res = await fetch('/api/contracts/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holder_id: clean, contract_id: clean })
      });
      const data = await res.json();

      if (data.contract) {
        setVerificationResult({
          found: true,
          holder_name: data.contract.holder_name,
          plan_name: data.contract.plan_name,
          isEligible: data.result?.status === 'COBERTO',
          status: data.result?.status,
          reason: data.result?.status === 'COBERTO' ? 'Associado regular. Desconto autorizado pelo convênio.' : data.result?.reason
        });
      } else {
        setVerificationResult({
          found: false,
          reason: 'CPF não localizado na base de associados ativos.'
        });
      }
    } catch {
      setVerificationResult({
        found: false,
        reason: 'Erro ao consultar elegibilidade do associado.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.discount_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Clube de Benefícios & Rede Conveniada</h2>
            <p className="text-xs text-zinc-400">Descontos em vida para associados em clínicas, farmácias, laboratórios e óticas.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsValidatorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            Validar Carteirinha (Balcão)
          </button>
          <button
            onClick={() => setIsNewPartnerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-pink-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Credenciar Parceiro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar parceiro ou tipo de desconto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-pink-500"
        >
          <option value="Todos">Todas as Categorias</option>
          <option value="Clínica Médica">Clínica Médica</option>
          <option value="Laboratório">Laboratório</option>
          <option value="Farmácia">Farmácia</option>
          <option value="Odontologia">Odontologia</option>
          <option value="Ótica">Ótica</option>
          <option value="Outros">Outros Convênios</option>
        </select>
      </div>

      {/* Grid de Parceiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.length === 0 ? (
          <div className="col-span-full p-8 text-center text-zinc-500 italic text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
            Nenhum parceiro conveniado encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredPartners.map((p, idx) => (
            <div key={idx} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-zinc-700 transition flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    {p.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm">{p.name}</h4>

                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2">
                  <Percent className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="font-medium">{p.discount_description}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
                {p.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    <span>{p.phone}</span>
                  </p>
                )}
                {p.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    <span>{p.address} - {p.city}</span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Credenciar Parceiro */}
      {isNewPartnerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">Cadastrar Parceiro Credenciado</h3>
              </div>
              <button onClick={() => setIsNewPartnerOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">Nome do Estabelecimento *</label>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Ex: Ótica Visual Teresina"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Categoria de Convênio</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Clínica Médica">Clínica Médica</option>
                    <option value="Laboratório">Laboratório</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Odontologia">Odontologia</option>
                    <option value="Ótica">Ótica</option>
                    <option value="Outros">Outros Convênios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(86) 3222-0000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Regra de Desconto para Associados *</label>
                <input
                  type="text"
                  required
                  value={discountDesc}
                  onChange={(e) => setDiscountDesc(e.target.value)}
                  placeholder="Ex: 30% em consultas e 15% em armações completas"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Endereço</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewPartnerOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !partnerName || !discountDesc}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Validador de Carteirinha (Padrão Balcão de Convênio) */}
      {isValidatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Validador de Balcão (Credenciados)</h3>
              </div>
              <button onClick={() => setIsValidatorOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleVerifyBeneficiary} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">CPF ou Nº da Carteirinha Digital</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={verifyCpf}
                    onChange={(e) => setVerifyCpf(e.target.value)}
                    placeholder="Digite o CPF do titular..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={verifying || !verifyCpf}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{verifying ? '...' : 'Checar'}</span>
                  </button>
                </div>
              </div>

              {verificationResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 mt-3 ${
                    verificationResult.isEligible
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {verificationResult.isEligible ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    )}
                    <span>
                      {verificationResult.isEligible
                        ? 'DESCONTO AUTORIZADO'
                        : 'DESCONTO NÃO AUTORIZADO'}
                    </span>
                  </div>

                  {verificationResult.found && (
                    <div className="bg-black/30 p-2.5 rounded-lg space-y-1 font-mono text-[11px] text-white">
                      <p>Titular: <strong>{verificationResult.holder_name}</strong></p>
                      <p>Plano: <span className="text-zinc-300">{verificationResult.plan_name}</span></p>
                    </div>
                  )}

                  <p className="text-[11px] opacity-90">{verificationResult.reason}</p>
                </div>
              )}
            </form>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsValidatorOpen(false);
                  setVerificationResult(null);
                  setVerifyCpf('');
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}