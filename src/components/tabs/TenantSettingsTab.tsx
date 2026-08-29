'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, Copy, Check, Building2, Globe } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  phone_emergency: string;
  municipal_license_number?: string;
  issuance_city?: string;
  technical_manager?: string;
  asaas_environment?: 'sandbox' | 'production';
  asaas_api_key?: string;
  asaas_webhook_token?: string;
}

export function TenantSettingsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Form states
  const [tradeName, setTradeName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phoneEmergency, setPhoneEmergency] = useState('');
  const [city, setCity] = useState('');
  const [manager, setManager] = useState('');
  const [asaasEnv, setAsaasEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [apiKey, setApiKey] = useState('');
  const [webhookToken, setWebhookToken] = useState('');

  const webhookUrl = 'https://eternitysos.vercel.app/api/billing/webhook';

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      if (data.success && data.tenants.length > 0) {
        setTenants(data.tenants);
        selectTenantData(data.tenants[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTenantData = (t: Tenant) => {
    setSelectedTenantId(t.id);
    setTradeName(t.trade_name || '');
    setLegalName(t.name || '');
    setCnpj(t.cnpj || '');
    setPhoneEmergency(t.phone_emergency || '');
    setCity(t.issuance_city || '');
    setManager(t.technical_manager || '');
    setAsaasEnv(t.asaas_environment || 'sandbox');
    setApiKey(t.asaas_api_key || '');
    setWebhookToken(t.asaas_webhook_token || '');
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleTenantChange = (tenantId: string) => {
    const found = tenants.find(t => t.id === tenantId);
    if (found) {
      selectTenantData(found);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTenantId,
          trade_name: tradeName,
          name: legalName,
          cnpj: cnpj,
          phone_emergency: phoneEmergency,
          issuance_city: city,
          technical_manager: manager,
          asaas_environment: asaasEnv,
          asaas_api_key: apiKey.trim() || null,
          asaas_webhook_token: webhookToken.trim() || null
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Configurações da Unidade e Gateway Asaas salvas com sucesso!');
        await loadTenants();
      } else {
        alert('Erro ao salvar: ' + (data.error || 'Falha na requisição.'));
      }
    } catch (err: any) {
      alert('Erro ao conectar com a API: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400 text-xs animate-pulse">
        Carregando parâmetros da filial...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Configurações da Empresa & Gateway</h2>
            <p className="text-xs text-zinc-400">Gestão cadastral da filial e integração com Asaas por CNPJ</p>
          </div>
        </div>

        {tenants.length > 1 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedTenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.trade_name} ({t.cnpj})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Dados Cadastrais */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-white">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Dados da Funerária / Filial</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Nome Fantasia</label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Razão Social</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Telefone Plantão / WhatsApp</label>
                <input
                  type="text"
                  value={phoneEmergency}
                  onChange={(e) => setPhoneEmergency(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Cidade / UF</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Teresina - PI"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Responsável Técnico</label>
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="Nome do Diretor / Gestor"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Integração Gateway Asaas */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-white">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Configurações Asaas (PIX & Boleto)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Ambiente Operacional</label>
              <select
                value={asaasEnv}
                onChange={(e: any) => setAsaasEnv(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="sandbox">Sandbox (Ambiente de Testes / Homologação)</option>
                <option value="production">Produção (Cobrança Real)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Chave de API do Asaas ($aact_...)</label>
              <input
                type="password"
                placeholder="Insira a API Key do Asaas da filial"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Se deixado em branco, o sistema utilizará as credenciais globais da plataforma configuradas no servidor.
              </p>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Token de Validação do Webhook (Opcional)</label>
              <input
                type="text"
                placeholder="Token de autenticação configurado no Asaas"
                value={webhookToken}
                onChange={(e) => setWebhookToken(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            {/* URL do Webhook para copiar */}
            <div className="pt-2">
              <label className="block font-medium text-zinc-400 mb-1 text-[11px]">URL do Webhook para cadastrar no Asaas:</label>
              <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <code className="text-[11px] text-emerald-400 font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  title="Copiar URL"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-50 shadow-lg shadow-blue-950/30"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{saving ? 'Gravando Parâmetros...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}