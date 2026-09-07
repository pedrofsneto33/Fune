'use client';

import { useEffect, useState } from 'react';
import { FileText, RefreshCw, Power, ExternalLink, AlertCircle, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { notifySuccess, notifyError } from '@/lib/notify';
import { authFetch } from '@/lib/authFetch';

type Invoice = {
  id: string;
  service_order_id: string | null;
  provider: string | null;
  provider_environment: string | null;
  nfse_number: string | null;
  nfse_status: 'pending' | 'processing' | 'authorized' | 'rejected' | 'cancelled' | 'error';
  nfse_verification_code: string | null;
  taker_name: string;
  taker_document: string;
  taker_document_type: string;
  service_description: string;
  service_amount: number;
  iss_amount: number;
  tax_rate: number;
  pdf_url: string | null;
  xml_url: string | null;
  issued_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  provider_error_message?: string;
};

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-400',
  processing: 'bg-blue-900/40 text-blue-400',
  authorized: 'bg-emerald-900/40 text-emerald-400',
  rejected: 'bg-rose-900/40 text-rose-400',
  cancelled: 'bg-slate-700 text-slate-400',
  error: 'bg-rose-900/40 text-rose-400',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  authorized: 'Autorizada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  error: 'Erro',
};

const STATUS_ICON: Record<string, any> = {
  pending: Clock,
  processing: RefreshCw,
  authorized: CheckCircle2,
  rejected: XCircle,
  cancelled: Power,
  error: AlertCircle,
};

export default function FiscalTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showCancel, setShowCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/fiscal/list' : '/api/fiscal/list?status=' + filter;
      const r = await authFetch(url);
      const j = await r.json();
      if (r.ok) {
        setInvoices(j.invoices || []);
      } else {
        notifyError('Erro: ' + (j.error || ''));
      }
    } catch {
      notifyError('Erro de conexao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await authFetch('/api/fiscal/test', { method: 'POST' });
      const j = await r.json();
      setTestResult({ ok: !!j.ok, message: j.message || '' });
      if (j.ok) notifySuccess('Conexao OK com o provedor.');
      else notifyError('Falha: ' + j.message);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const doCancel = async () => {
    if (!showCancel) return;
    if (cancelReason.trim().length < 15) {
      notifyError('Justificativa deve ter no minimo 15 caracteres.');
      return;
    }
    try {
      const r = await authFetch('/api/fiscal/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: showCancel.id, reason: cancelReason }),
      });
      const j = await r.json();
      if (r.ok) {
        notifySuccess('NFS-e cancelada.');
        setShowCancel(null);
        setCancelReason('');
        load();
      } else {
        notifyError('Erro: ' + (j.error || ''));
      }
    } catch {
      notifyError('Erro de conexao.');
    }
  };

  const counts = {
    authorized: invoices.filter((i) => i.nfse_status === 'authorized').length,
    pending: invoices.filter((i) => ['pending', 'processing'].includes(i.nfse_status)).length,
    rejected: invoices.filter((i) => ['rejected', 'error'].includes(i.nfse_status)).length,
    cancelled: invoices.filter((i) => i.nfse_status === 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            Notas Fiscais de Servico (NFS-e)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Emissao e gestao de NFS-e via FocusNFe. Configure o provedor em
            <strong className="text-slate-300"> Configuracoes da Empresa {'>'} Fiscal</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runTest}
            disabled={testing}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
            {testing ? 'Testando...' : 'Testar Conexao'}
          </button>
          <button
            onClick={load}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg text-xs font-semibold ${testResult.ok ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/30 text-rose-300 border border-rose-700/50'}`}>
          {testResult.ok ? 'OK: ' : 'Erro: '}
          {testResult.message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0d121f] border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Autorizadas</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{counts.authorized}</p>
        </div>
        <div className="bg-[#0d121f] border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Em Processamento</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{counts.pending}</p>
        </div>
        <div className="bg-[#0d121f] border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Rejeitadas/Erro</p>
          <p className="text-xl font-bold text-rose-400 mt-1">{counts.rejected}</p>
        </div>
        <div className="bg-[#0d121f] border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Canceladas</p>
          <p className="text-xl font-bold text-slate-400 mt-1">{counts.cancelled}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['all', 'pending', 'processing', 'authorized', 'rejected', 'cancelled', 'error'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s === 'all' ? 'Todas' : STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>

      <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden">
        {loading && <p className="px-4 py-3 text-xs text-slate-500">carregando...</p>}
        {!loading && invoices.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            Nenhuma NFS-e emitida. Configure o provedor em Configuracoes da Empresa.
          </p>
        )}
        {!loading && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="text-left px-4 py-2">NFS-e / Data</th>
                  <th className="text-left px-4 py-2">Tomador</th>
                  <th className="text-left px-4 py-2">Servico</th>
                  <th className="text-right px-4 py-2">Valor / ISS</th>
                  <th className="text-center px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const Icon = STATUS_ICON[inv.nfse_status] || AlertCircle;
                  return (
                    <tr key={inv.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                      <td className="px-4 py-2">
                        <p className="font-bold text-slate-100">{inv.nfse_number || '(processando)'}</p>
                        <p className="text-[10px] text-slate-500">{new Date(inv.created_at).toLocaleString('pt-BR')}</p>
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        <p className="font-semibold">{inv.taker_name}</p>
                        <p className="text-[10px] text-slate-500">{inv.taker_document_type.toUpperCase()}: {inv.taker_document}</p>
                      </td>
                      <td className="px-4 py-2 text-slate-400 max-w-xs truncate" title={inv.service_description}>{inv.service_description}</td>
                      <td className="px-4 py-2 text-right">
                        <p className="font-bold text-emerald-400">{fmtBRL(inv.service_amount)}</p>
                        <p className="text-[10px] text-slate-500">ISS: {fmtBRL(inv.iss_amount)} ({inv.tax_rate}%)</p>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[inv.nfse_status]}`}>
                          <Icon size={10} />
                          {STATUS_LABEL[inv.nfse_status]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-1">
                          {inv.pdf_url && (
                            <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400" title="Abrir PDF">
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {inv.nfse_status === 'authorized' && (
                            <button onClick={() => { setShowCancel(inv); setCancelReason(''); }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-700 text-rose-400" title="Cancelar NFS-e">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-400 mb-3">Cancelar NFS-e #{showCancel.nfse_number}</h3>
            <p className="text-xs text-slate-400 mb-3">A justificativa sera enviada para a prefeitura. Minimo 15 caracteres.</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white"
              placeholder="Ex: Erro de digitacao no valor, servico nao foi prestado..." />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowCancel(null); setCancelReason(''); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs">Cancelar</button>
              <button onClick={doCancel} disabled={cancelReason.trim().length < 15}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs disabled:opacity-50">
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

