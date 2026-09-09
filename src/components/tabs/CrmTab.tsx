"use client";

import React, { useCallback, useEffect, useState } from "react";
import { notifySuccess, notifyError } from "@/lib/notify";
import { authFetch } from "@/lib/authFetch";
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  nextLeadStage,
  waLink,
  type LeadStage,
} from "@/lib/crm";

interface Lead {
  id: string;
  name: string;
  company: string | null;
  city: string | null;
  uf: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  stage: LeadStage;
  estimated_monthly: number;
  next_follow_up: string | null;
  notes: string | null;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v) || 0,
  );

const isOverdue = (lead: Lead) => {
  if (!lead.next_follow_up) return false;
  if (lead.stage === "ganho" || lead.stage === "perdido") return false;
  return lead.next_follow_up < new Date().toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  name: "",
  company: "",
  city: "",
  uf: "",
  phone: "",
  email: "",
  source: "manual",
  estimated_monthly: "",
  next_follow_up: "",
  notes: "",
};

export default function CrmTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteArmId, setDeleteArmId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/leads");
      const data = await res.json().catch(() => []);
      if (res.ok) setLeads(Array.isArray(data) ? data : []);
      else notifyError(data.error || "Erro ao carregar leads");
    } catch {
      notifyError("Erro de conexão ao carregar leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const patchLead = async (id: string, patch: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await authFetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data.error || "Erro ao atualizar lead");
        return;
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...patch } as Lead) : l)),
      );
      notifySuccess("Lead atualizado!");
    } catch {
      notifyError("Erro de conexão");
    } finally {
      setBusyId(null);
      setDeleteArmId(null);
    }
  };

  const deleteLead = async (id: string) => {
    // Exclusão destrutiva: 1º clique arma, 2º confirma.
    if (deleteArmId !== id) {
      setDeleteArmId(id);
      return;
    }
    setBusyId(id);
    try {
      const res = await authFetch(`/api/leads?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notifyError(data.error || "Erro ao excluir");
        return;
      }
      setLeads((prev) => prev.filter((l) => l.id !== id));
      notifySuccess("Lead excluído");
    } catch {
      notifyError("Erro de conexão");
    } finally {
      setBusyId(null);
      setDeleteArmId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimated_monthly: Number(form.estimated_monthly) || 0,
          next_follow_up: form.next_follow_up || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data.error || "Erro ao criar lead");
        return;
      }
      setLeads((prev) => [data as Lead, ...prev]);
      notifySuccess("Lead criado!");
      setForm({ ...EMPTY_FORM });
      setIsNewOpen(false);
    } catch {
      notifyError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  // KPIs do funil
  const ganhos = leads.filter((l) => l.stage === "ganho");
  const mrrGanho = ganhos.reduce((a, l) => a + Number(l.estimated_monthly || 0), 0);
  const noFunil = leads.filter((l) => !["ganho", "perdido"].includes(l.stage)).length;
  const atrasados = leads.filter(isOverdue).length;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            🎯 CRM — Funil de Vendas do EternityOS
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Interessados em contratar o sistema (não são dados de funerária cliente).
          </p>
        </div>
        <button
          onClick={() => setIsNewOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Lead
        </button>
      </div>

      {/* KPIs do funil */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Leads no funil</p>
          <p className="text-lg font-black text-blue-400">{noFunil}</p>
        </div>
        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Follow-ups atrasados</p>
          <p className={`text-lg font-black ${atrasados > 0 ? "text-rose-400" : "text-slate-400"}`}>{atrasados}</p>
        </div>
        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Contratos fechados</p>
          <p className="text-lg font-black text-emerald-400">{ganhos.length}</p>
        </div>
        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">MRR estimado (ganho)</p>
          <p className="text-lg font-black text-emerald-400">{fmtBRL(mrrGanho)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-8 text-center">Carregando funil...</p>
      ) : leads.length === 0 ? (
        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-400 font-bold mb-1">Nenhum lead ainda</p>
          <p className="text-xs text-slate-500">
            Cadastre manualmente com “+ Novo Lead” — e a landing page (seção de demonstração) já joga os interessados direto aqui.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="min-w-[260px] w-[260px] flex-shrink-0">
                <div className={`px-3 py-2 rounded-t-lg border border-b-0 bg-slate-950 ${LEAD_STAGE_COLORS[stage]}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wider">
                    {LEAD_STAGE_LABELS[stage]} ({stageLeads.length})
                  </p>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-b-lg p-2 space-y-2 min-h-[120px] bg-[#0d121f]">
                  {stageLeads.length === 0 && (
                    <p className="text-[10px] text-slate-600 text-center py-4">—</p>
                  )}
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`bg-slate-950 border rounded-lg p-2.5 text-xs space-y-1.5 ${isOverdue(lead) ? "border-rose-600/60" : "border-slate-800"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-100 leading-tight">{lead.name}</p>
                        {isOverdue(lead) && (
                          <span className="text-[9px] font-bold text-rose-400 whitespace-nowrap">ATRASADO</span>
                        )}
                      </div>
                      {(lead.company || lead.city) && (
                        <p className="text-[10px] text-slate-500">
                          {[lead.company, lead.city].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {Number(lead.estimated_monthly) > 0 && (
                        <p className="text-[10px] text-emerald-400 font-bold">
                          {fmtBRL(lead.estimated_monthly)}/mês
                        </p>
                      )}
                      {lead.next_follow_up && (
                        <p className="text-[10px] text-slate-500">📅 retorno: {lead.next_follow_up}</p>
                      )}
                      {lead.notes && (
                        <p className="text-[10px] text-slate-600 line-clamp-2">{lead.notes}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {lead.phone && (
                          <a
                            href={waLink(lead.phone, `Olá ${lead.name}, tudo bem? Aqui é o Pedro, da PrimeX Sistemas. Sobre o sistema de gestão para funerárias...`)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold"
                          >
                            💬 Zap
                          </a>
                        )}
                        {nextLeadStage(lead.stage) && (
                          <button
                            disabled={busyId === lead.id}
                            onClick={() => patchLead(lead.id, { stage: nextLeadStage(lead.stage) })}
                            className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold disabled:opacity-50"
                          >
                            Avançar →
                          </button>
                        )}
                        {lead.stage !== "perdido" && lead.stage !== "ganho" && (
                          <button
                            disabled={busyId === lead.id}
                            onClick={() => patchLead(lead.id, { stage: "perdido" })}
                            className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold disabled:opacity-50"
                          >
                            Perder
                          </button>
                        )}
                        <button
                          disabled={busyId === lead.id}
                          onClick={() => deleteLead(lead.id)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border disabled:opacity-50 ${deleteArmId === lead.id ? "bg-rose-700 text-white border-rose-500" : "bg-slate-900 text-slate-500 border-slate-800"}`}
                        >
                          {deleteArmId === lead.id ? "Confirmar?" : "🗑"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewOpen && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="font-bold text-sm text-emerald-400">+ Novo Lead (funerária interessada)</h3>
              <button onClick={() => setIsNewOpen(false)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do contato *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Quem decide na funerária" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Funerária / empresa</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nome fantasia" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Cidade</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">UF</label>
                  <input maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} placeholder="PI" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">WhatsApp *</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(86) 99999-0000" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Origem</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mensalidade (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.estimated_monthly} onChange={(e) => setForm({ ...form, estimated_monthly: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Retorno</label>
                  <input type="date" value={form.next_follow_up} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Anotações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contexto, objeções, tamanho da funerária..." className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <button disabled={saving} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50">
                {saving ? "Salvando..." : "Criar Lead"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
