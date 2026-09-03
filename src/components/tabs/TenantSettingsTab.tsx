'use client';


import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';
import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, Copy, Check, Building2, Upload, Image as ImageIcon } from 'lucide-react';
import { getPlanByCode, formatPlanPrice, COMMERCIAL_PLANS } from '@/lib/planLimits';
import { supabase } from '@/lib/supabaseClient';

interface Tenant {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  phone_emergency: string;
  primary_color?: string;
  logo_url?: string;
  municipal_license_number?: string;
  issuance_city?: string;
  technical_manager?: string;
  asaas_environment?: 'sandbox' | 'production';
  has_asaas_api_key?: boolean;
  has_asaas_webhook_token?: boolean;
  commercial_plan?: string;
  usage?: { holders: number; users: number };
}

export function TenantSettingsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const [tradeName, setTradeName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phoneEmergency, setPhoneEmergency] = useState('');
  const [city, setCity] = useState('');
  const [manager, setManager] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');
  const [asaasEnv, setAsaasEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [apiKey, setApiKey] = useState('');
  const [webhookToken, setWebhookToken] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasWebhookToken, setHasWebhookToken] = useState(false);
  const [commercialPlan, setCommercialPlan] = useState('essencial');
  const [canManagePlan, setCanManagePlan] = useState(false);

  // ONBOARDING: Cadastro de nova funeraria cliente (superadmin apenas)
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    name: '',
    trade_name: '',
    cnpj: '',
    phone_emergency: '',
    issuance_city: '',
    primary_color: '#7c3aed',
    commercial_plan: 'essencial',
  });

  const webhookUrl = 'https://eternitysos.vercel.app/api/webhooks/asaas';

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const loadTenants = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/tenants', { headers });
      const data = await res.json();
      if (data.success && data.tenants?.length > 0) {
        setTenants(data.tenants);
        setCanManagePlan(!!data.can_manage_plan);
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
    setPrimaryColor(t.primary_color || '#2563eb');
    setLogoUrl(t.logo_url || '');
    setAsaasEnv(t.asaas_environment || 'sandbox');
    setApiKey('');
    setWebhookToken('');
    setHasApiKey(!!t.has_asaas_api_key);
    setHasWebhookToken(!!t.has_asaas_webhook_token);
    setCommercialPlan(t.commercial_plan || 'essencial');
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleTenantChange = (tenantId: string) => {
    const found = tenants.find(t => t.id === tenantId);
    if (found) selectTenantData(found);
  };

  // ONBOARDING: cria a funeraria do cliente novo (POST /api/tenants - superadmin)
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantForm.name.trim() || !newTenantForm.cnpj.trim()) {
      notifyInfo('Nome da empresa e CNPJ sao obrigatorios.');
      return;
    }
    setCreatingTenant(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers,
        body: JSON.stringify(newTenantForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewTenantOpen(false);
        await loadTenants();
        notifySuccess('Funeraria cadastrada com sucesso!\n\n' +
          'PROXIMOS PASSOS:\n' +
          '1. O dono da funeraria cria a conta dele na tela de login (Cadastro).\n' +
          '2. Va em Permissoes, insira o e-mail dele, cargo Admin, e selecione esta funeraria.\n' +
          '3. Ele passara a administrar apenas os dados da funeraria dele.\n\n' +
          'ID da funeraria: ' + (data.id || '')
        );
        setNewTenantForm({
          name: '', trade_name: '', cnpj: '', phone_emergency: '',
          issuance_city: '', primary_color: '#7c3aed', commercial_plan: 'essencial',
        });
      } else {
        notifyError('Erro ao criar funeraria: ' + (data.error || 'Falha na requisicao.'));
      }
    } catch (err: any) {
      notifyError('Erro ao conectar com a API: ' + err.message);
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTenantId) return;

    if (file.size > 2 * 1024 * 1024) {
      notifyError('A imagem deve ter no maximo 2MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${selectedTenantId}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('tenant-logos').getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
    } catch (err: any) {
      notifyError('Erro ao enviar logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          tenant_id: selectedTenantId,
          trade_name: tradeName,
          name: legalName,
          cnpj: cnpj,
          phone_emergency: phoneEmergency,
          issuance_city: city,
          technical_manager: manager,
          primary_color: primaryColor,
          logo_url: logoUrl,
          asaas_environment: asaasEnv,
          asaas_api_key: apiKey.trim() || undefined,
          asaas_webhook_token: webhookToken.trim() || undefined,
          // SECURITY: plano comercial so e enviado quando o usuario tem permissao
          // (can_manage_plan = true apenas para superadmin). Para admins, o campo
          // nem vai no payload - a API retorna 403 se tentarem trocar de plano.
          ...(canManagePlan ? { commercial_plan: commercialPlan } : {}),
        })
      });

      const data = await res.json();
      if (data.success) {
        notifySuccess('Configuracoes salvas com sucesso!');
        await loadTenants();
      } else {
        notifyError('Erro ao salvar: ' + (data.error || 'Falha na requisicao.'));
      }
    } catch (err: any) {
      notifyError('Erro ao conectar com a API: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedTenant = tenants.find((t: Tenant) => t.id === selectedTenantId);
  const usage = selectedTenant?.usage || { holders: 0, users: 0 };
  const activePlan = getPlanByCode(commercialPlan);
  const holdersLimit = activePlan.maxHolders === Number.MAX_SAFE_INTEGER ? Infinity : activePlan.maxHolders;
  const usersLimit = activePlan.maxUsers === Number.MAX_SAFE_INTEGER ? Infinity : activePlan.maxUsers;
  const pctOf = (n: number, max: number) => (max === Infinity ? 0 : Math.min(100, Math.round((n / max) * 100)));
  const holdersPct = pctOf(usage.holders, holdersLimit);
  const usersPct = pctOf(usage.users, usersLimit);

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400 text-xs animate-pulse">
        Carregando parametros da filial...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Configuracoes da Empresa & Gateway</h2>
            <p className="text-xs text-zinc-400">Identidade visual, dados cadastrais e integracao com Asaas</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManagePlan && (
            <button
              type="button"
              onClick={() => setIsNewTenantOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition shadow-lg shadow-violet-950/30"
            >
              <Building2 className="w-4 h-4" />
              + Nova Funeraria
            </button>
          )}
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
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Plano Comercial e Limites de Uso</span>
            </div>
            {canManagePlan ? (
              <select value={commercialPlan} onChange={(e) => setCommercialPlan(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                <option value="essencial">Essencial - {formatPlanPrice(COMMERCIAL_PLANS.essencial)}/mes</option>
                <option value="profissional">Profissional - {formatPlanPrice(COMMERCIAL_PLANS.profissional)}/mes</option>
                <option value="enterprise">Enterprise - Sob consulta</option>
              </select>
            ) : (
              <span className="text-[11px] font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Plano {getPlanByCode(commercialPlan).name} - alteravel apenas pelo Super Admin
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-300">
                <span>Titulares cadastrados</span>
                <span className="font-mono text-white">{usage.holders} / {holdersLimit === Infinity ? 'Ilimitado' : holdersLimit}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={"h-full rounded-full " + (holdersPct >= 100 ? 'bg-red-500' : holdersPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ width: holdersPct + '%' }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-300">
                <span>Usuarios do sistema</span>
                <span className="font-mono text-white">{usage.users} / {usersLimit === Infinity ? 'Ilimitado' : usersLimit}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={"h-full rounded-full " + (usersPct >= 100 ? 'bg-red-500' : usersPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ width: usersPct + '%' }} />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500">
            Ao atingir o limite do plano, o cadastro de novos titulares e usuarios e bloqueado automaticamente.
            O plano selecionado e aplicado por filial (tenant) ao salvar as configuracoes.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-white">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>Identidade Visual</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo da empresa" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-6 h-6 text-zinc-600" />
              )}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white cursor-pointer transition w-fit">
                {uploadingLogo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{uploadingLogo ? 'Enviando...' : 'Enviar Logo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
              <p className="text-[10px] text-zinc-500">PNG ou JPG, ate 2MB. Aparece na carteirinha e nos relatorios.</p>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <label className="text-xs font-medium text-zinc-300">Cor Principal</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-white">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Dados da Funeraria / Filial</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Nome Fantasia</label>
              <input type="text" value={tradeName} onChange={(e) => setTradeName(e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Razao Social</label>
              <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">CNPJ</label>
                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Telefone Plantao / WhatsApp</label>
                <input type="text" value={phoneEmergency} onChange={(e) => setPhoneEmergency(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Cidade / UF</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Teresina - PI"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Responsavel Tecnico</label>
                <input type="text" value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Nome do Diretor / Gestor"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-white">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Configuracoes Asaas (PIX & Boleto)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Ambiente Operacional</label>
              <select value={asaasEnv} onChange={(e: any) => setAsaasEnv(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                <option value="sandbox">Sandbox (Ambiente de Testes / Homologacao)</option>
                <option value="production">Producao (Cobranca Real)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                Chave de API do Asaas ($aact_...) {hasApiKey && <span className="text-emerald-400">(ja configurada)</span>}
              </label>
              <input type="password" placeholder={hasApiKey ? 'Deixe em branco para manter a atual' : 'Insira a API Key do Asaas da filial'}
                value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                Token de Validacao do Webhook {hasWebhookToken && <span className="text-emerald-400">(ja configurado)</span>}
              </label>
              <input type="text" placeholder={hasWebhookToken ? 'Deixe em branco para manter o atual' : 'Token configurado no Asaas'}
                value={webhookToken} onChange={(e) => setWebhookToken(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono" />
            </div>
            <div className="pt-2">
              <label className="block font-medium text-zinc-400 mb-1 text-[11px]">URL do Webhook para cadastrar no Asaas:</label>
              <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <code className="text-[11px] text-emerald-400 font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {webhookUrl}
                </code>
                <button type="button" onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                }} className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition" title="Copiar URL">
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-50 shadow-lg shadow-blue-950/30">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{saving ? 'Gravando Parametros...' : 'Salvar Alteracoes'}</span>
          </button>
        </div>
      </form>

      {/* MODAL ONBOARDING: NOVA FUNERARIA (superadmin) */}
      {isNewTenantOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-violet-400 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Cadastrar Nova Funeraria Cliente
            </h3>
            <p className="text-[11px] text-zinc-500 mb-4">
              Cada funeraria opera em ambiente 100% isolado. Os dados jamais se misturam entre clientes.
            </p>
            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-zinc-300 mb-1">Razao Social *</label>
                  <input type="text" required value={newTenantForm.name}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                    placeholder="ex: Funeraria Sao Judas Tadeu LTDA"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-violet-500 focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-zinc-300 mb-1">Nome Fantasia</label>
                  <input type="text" value={newTenantForm.trade_name}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, trade_name: e.target.value })}
                    placeholder="ex: Sao Judas Tadeu"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-violet-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">CNPJ *</label>
                  <input type="text" required value={newTenantForm.cnpj}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-violet-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Tel. Plantao 24h</label>
                  <input type="text" value={newTenantForm.phone_emergency}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, phone_emergency: e.target.value })}
                    placeholder="(86) 99999-0000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-violet-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Cidade de Atuacao</label>
                  <input type="text" value={newTenantForm.issuance_city}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, issuance_city: e.target.value })}
                    placeholder="ex: Teresina - PI"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-violet-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Cor da Marca</label>
                  <input type="color" value={newTenantForm.primary_color}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, primary_color: e.target.value })}
                    className="w-full h-9 bg-zinc-800 border border-zinc-700 rounded-lg px-1 cursor-pointer" />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-zinc-300 mb-1">Plano Comercial *</label>
                  <select value={newTenantForm.commercial_plan}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, commercial_plan: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-violet-500 focus:outline-none">
                    <option value="essencial">Essencial - {formatPlanPrice(COMMERCIAL_PLANS.essencial)}/mes</option>
                    <option value="profissional">Profissional - {formatPlanPrice(COMMERCIAL_PLANS.profissional)}/mes</option>
                    <option value="enterprise">Enterprise - Sob consulta</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 mt-4">
                <button type="button" onClick={() => setIsNewTenantOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={creatingTenant}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-bold disabled:opacity-50">
                  {creatingTenant ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
                  {creatingTenant ? 'Cadastrando...' : 'Cadastrar Funeraria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
