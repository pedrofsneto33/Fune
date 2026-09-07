'use client';

import { useEffect, useState } from 'react';
import { FileText, RefreshCw, Save, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { notifySuccess, notifyError } from '@/lib/notify';
import { authFetch } from '@/lib/authFetch';

type FiscalConfigData = {
  fiscal_provider: string | null;
  fiscal_environment: string;
  fiscal_api_key: string | null;
  fiscal_api_key_masked?: string | null;
  fiscal_company_document: string | null;
  fiscal_company_name: string | null;
  fiscal_company_zip: string | null;
  fiscal_company_address: string | null;
  fiscal_company_number: string | null;
  fiscal_company_neighborhood: string | null;
  fiscal_company_city: string | null;
  fiscal_company_state: string | null;
  fiscal_company_phone: string | null;
  fiscal_company_email: string | null;
  fiscal_company_ibge_code: string | null;
  fiscal_company_tax_regime: string | null;
  fiscal_cnae: string | null;
  fiscal_default_service_code: string | null;
  fiscal_default_service_description: string | null;
  fiscal_default_iss_rate: number;
  fiscal_auto_emit: boolean;
  fiscal_last_test_at: string | null;
  fiscal_last_test_status: string | null;
};

export default function FiscalSettingsSection() {
  const [cfg, setCfg] = useState<FiscalConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await authFetch('/api/fiscal/config');
      const j = await r.json();
      if (r.ok) {
        setCfg(j);
        setTestResult(null);
      } else {
        notifyError('Erro ao carregar config: ' + (j.error || ''));
      }
    } catch {
      notifyError('Erro de conexao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (field: keyof FiscalConfigData, value: any) => {
    if (!cfg) return;
    setCfg({ ...cfg, [field]: value });
  };

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const r = await authFetch('/api/fiscal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const j = await r.json();
      if (r.ok) {
        notifySuccess('Configuracao fiscal salva.');
        await load();
      } else {
        notifyError('Erro: ' + (j.error || ''));
      }
    } catch {
      notifyError('Erro de conexao.');
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await authFetch('/api/fiscal/test', { method: 'POST' });
      const j = await r.json();
      setTestResult({ ok: !!j.ok, message: j.message || '' });
      if (j.ok) notifySuccess('Conexao OK.');
      else notifyError('Falha: ' + j.message);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
      setTimeout(() => load(), 1000);
    }
  };

  if (loading || !cfg) {
    return (
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
        <p className="text-xs text-slate-500">carregando configuracao fiscal...</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
        <FileText size={16} className="text-blue-400" />
        Configuracao Fiscal (NFS-e)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Emissao de NFS-e via FocusNFe. Sandbox gratis, producao por NFS-e emitida.
        <a href="https://focusnfe.com.br/" target="_blank" rel="noopener noreferrer" className="text-blue-400 ml-1 inline-flex items-center gap-0.5">
          Criar conta <ExternalLink size={10} />
        </a>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Provedor</label>
          <select value={cfg.fiscal_provider || ''} onChange={(e) => update('fiscal_provider', e.target.value || null)}
            className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
            <option value="">(desabilitado)</option>
            <option value="focusnfe">FocusNFe</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ambiente</label>
          <select value={cfg.fiscal_environment} onChange={(e) => update('fiscal_environment', e.target.value)}
            className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
            <option value="sandbox">Sandbox (gratis, teste)</option>
            <option value="production">Producao (pago por NFS-e)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">API Key (token FocusNFe)</label>
          <div className="flex gap-2">
            <input type={showKey ? 'text' : 'password'} value={cfg.fiscal_api_key || ''}
              onChange={(e) => update('fiscal_api_key', e.target.value)} placeholder="Cole aqui o token do FocusNFe"
              className="flex-1 bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
            <button type="button" onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white rounded-lg text-xs">
              {showKey ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {cfg.fiscal_api_key_masked && !showKey && (
            <p className="text-[10px] text-slate-500 mt-1">Atual: {cfg.fiscal_api_key_masked}</p>
          )}
        </div>
      </div>

      <details className="mt-4 group">
        <summary className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white">
          Dados da funeraria (prestador) ▾
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">CNPJ *</label>
            <input value={cfg.fiscal_company_document || ''} onChange={(e) => update('fiscal_company_document', e.target.value.replace(/\D/g, '').substring(0, 14))} placeholder="00000000000000"
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Razao Social *</label>
            <input value={cfg.fiscal_company_name || ''} onChange={(e) => update('fiscal_company_name', e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">CEP</label>
            <input value={cfg.fiscal_company_zip || ''} onChange={(e) => update('fiscal_company_zip', e.target.value.replace(/\D/g, '').substring(0, 8))} placeholder="00000000"
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Endereco</label>
            <input value={cfg.fiscal_company_address || ''} onChange={(e) => update('fiscal_company_address', e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Numero</label>
            <input value={cfg.fiscal_company_number || ''} onChange={(e) => update('fiscal_company_number', e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Bairro</label>
            <input value={cfg.fiscal_company_neighborhood || ''} onChange={(e) => update('fiscal_company_neighborhood', e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cidade</label>
            <input value={cfg.fiscal_company_city || ''} onChange={(e) => update('fiscal_company_city', e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">UF</label>
            <input maxLength={2} value={cfg.fiscal_company_state || ''} onChange={(e) => update('fiscal_company_state', e.target.value.toUpperCase())} placeholder="SP"
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Codigo IBGE (7 digitos) *</label>
            <input value={cfg.fiscal_company_ibge_code || ''} onChange={(e) => update('fiscal_company_ibge_code', e.target.value.replace(/\D/g, '').substring(0, 7))} placeholder="3550308"
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Regime Tributario</label>
            <select value={cfg.fiscal_company_tax_regime || ''} onChange={(e) => update('fiscal_company_tax_regime', e.target.value || null)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
              <option value="">(definir)</option>
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
              <option value="mei">MEI</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">CNAE (ex: 9603-3/03)</label>
            <input value={cfg.fiscal_cnae || ''} onChange={(e) => update('fiscal_cnae', e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
          </div>
        </div>
      </details>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Codigo servico (LCS)</label>
          <input value={cfg.fiscal_default_service_code || ''} onChange={(e) => update('fiscal_default_service_code', e.target.value)} placeholder="11.05"
            className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
        </div>
        <div>
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Aliquota ISS (%)</label>
          <input type="number" step="0.01" min="0" max="100" value={cfg.fiscal_default_iss_rate} onChange={(e) => update('fiscal_default_iss_rate', Number(e.target.value))}
            className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input id="fiscal-auto" type="checkbox" checked={cfg.fiscal_auto_emit} onChange={(e) => update('fiscal_auto_emit', e.target.checked)} />
          <label htmlFor="fiscal-auto" className="font-medium text-zinc-700 dark:text-zinc-300">Emissao automatica</label>
        </div>
      </div>

      {testResult && (
        <div className={`mt-4 p-3 rounded-lg text-xs font-semibold ${testResult.ok ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/30 text-rose-300 border border-rose-700/50'}`}>
          {testResult.ok ? <CheckCircle2 size={12} className="inline mr-1" /> : <AlertCircle size={12} className="inline mr-1" />}
          {testResult.message}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={test} disabled={testing || !cfg.fiscal_provider || !cfg.fiscal_api_key}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
          {testing ? 'Testando...' : 'Testar Conexao'}
        </button>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
          <Save size={12} />
          {saving ? 'Salvando...' : 'Salvar Configuracao'}
        </button>
      </div>
    </div>
  );
}
