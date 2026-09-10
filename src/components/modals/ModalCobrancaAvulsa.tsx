"use client";

import React, { useState } from "react";
import { X, Banknote } from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notify";
import { authFetch } from "@/lib/authFetch";

// FASE 1 — COBRANÇA AVULSA (cliente não-associado)
// Formulário que coleta nome/CPF/telefone do responsável e gera boleto ou PIX
// via /api/billing/avulso. Não exige titular ativo/contrato (é avulso de propósito).
export function ModalCobrancaAvulsa({
  isOpen,
  onClose,
  defaultName,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  onSuccess?: () => void;
}) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [desc, setDesc] = useState("Serviço funerário avulso");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  );
  const [billingType, setBillingType] = useState<"BOLETO" | "PIX">("BOLETO");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    invoiceUrl?: string | null;
    pixQr?: string;
    pixCopy?: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setResult(null);
      setDesc(defaultName ? `Funeral de ${defaultName}` : "Serviço funerário avulso");
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      console.log("[Avulso] Enviando requisição...");
      const res = await authFetch("/api/billing/avulso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsavel_nome: nome,
          responsavel_cpf: cpf,
          responsavel_phone: phone,
          descricao: desc,
          valor: Number(valor),
          vencimento,
          billingType,
        }),
      });
      console.log("[Avulso] Status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.log("[Avulso] Resposta:", data);
      if (!res.ok) throw new Error(data.error || "Erro ao gerar cobrança");
      setResult({
        invoiceUrl: data.invoiceUrl,
        pixQr: data.pix_qr_image || undefined,
        pixCopy: data.pix_qr_code || undefined,
      });
      notifySuccess(`Cobrança avulsa gerada! ${data.message || ""}`);
      if (data.warning) notifyError(data.warning);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[Avulso] Erro:", err);
      notifyError("Erro: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h3 className="font-bold text-sm flex items-center gap-2 text-amber-400">
            <Banknote className="w-4 h-4" /> Cobrança Avulsa (não-associado)
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-3 text-sm">
            <p className="text-emerald-400 font-bold">
              {result.invoiceUrl || result.pixCopy ? "Cobrança gerada com sucesso!" : "Cobrança registrada com sucesso!"}
            </p>
            {result.invoiceUrl && (
              <a href={result.invoiceUrl} target="_blank" rel="noreferrer" className="block text-center py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Ver boleto
              </a>
            )}
            {result.pixQr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.pixQr} alt="QR Code PIX" className="w-40 h-40 mx-auto rounded-lg" />
            )}
            {result.pixCopy && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] break-all font-mono">
                {result.pixCopy}
              </div>
            )}
            {result.pixCopy && (
              <button
                onClick={() => navigator.clipboard?.writeText(result.pixCopy || "")}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Copiar código PIX
              </button>
            )}
            {!result.invoiceUrl && !result.pixCopy && (
              <p className="text-[11px] text-slate-400">
                A cobrança foi criada no Asaas e já aparece no painel de Vendas Avulsas e no Livro Caixa. Para visualizar/compensar o boleto, acesse o painel do Asaas.
              </p>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 p-5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nome do responsável (quem paga) *</label>
              <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">CPF do responsável *</label>
                <input required value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Telefone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(86) 99999-0000" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Descrição do serviço</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Valor (R$) *</label>
                <input required type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Vencimento</label>
                <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Forma</label>
                <select value={billingType} onChange={(e) => setBillingType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white">
                  <option value="BOLETO">Boleto</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-50">
              {loading ? "Gerando cobrança..." : "Gerar Cobrança Avulsa"}
            </button>
            <p className="text-[10px] text-slate-500">
              Para clientes que não são associados (funeral avulso). O boleto/PIX é emitido no Asaas e a receita entra em Financeiro como "Serviço Funeral Avulso".
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
