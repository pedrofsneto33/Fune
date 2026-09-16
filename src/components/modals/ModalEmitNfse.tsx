"use client";

import React, { useState } from "react";
import { X, FileText } from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notify";
import { authFetch } from "@/lib/authFetch";

// 12c-2: emite NFS-e vinculada a uma OS (POST /api/fiscal/emit — FocusNFe).
// O tomador (quem contrata) e informado no ato: para OS particular ('free')
// nao existe holder com CPF. Prefill: nome <- falecido (editavel), valor <- total da OS.
export function ModalEmitNfse({
  isOpen,
  onClose,
  serviceOrderId,
  defaultCustomerName,
  defaultAmount,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  serviceOrderId: string;
  defaultCustomerName?: string;
  defaultAmount?: number;
  onSuccess?: () => void;
}) {
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cpf");
  const [document, setDocument] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("Serviço funerário");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // ao abrir: reset + prefill a partir da OS
  React.useEffect(() => {
    if (isOpen) {
      setDocumentType("cpf");
      setDocument("");
      setName(defaultCustomerName || "");
      setEmail("");
      setPhone("");
      setDescription("Serviço funerário");
      setAmount(defaultAmount && defaultAmount > 0 ? String(defaultAmount) : "");
      setSaving(false);
    }
  }, [isOpen, defaultCustomerName, defaultAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = document.replace(/\D/g, "");
    const min = documentType === "cpf" ? 11 : 14;
    if (digits.length < min) {
      notifyError(
        documentType === "cpf"
          ? "CPF do tomador inválido (11 dígitos)."
          : "CNPJ do tomador inválido (14 dígitos).",
      );
      return;
    }
    if (!name || name.trim().length < 3) {
      notifyError("Nome do tomador é obrigatório (mínimo 3 caracteres).");
      return;
    }
    const valor = Number(amount);
    if (!valor || valor <= 0) {
      notifyError("Valor da nota deve ser maior que zero.");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/fiscal/emit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_order_id: serviceOrderId,
          taker: {
            documentType,
            document: digits,
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          },
          service: {
            description: description.trim() || "Serviço funerário",
            amount: valor,
          },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        notifySuccess(j.message || "NFS-e emitida.");
        onSuccess?.();
        onClose();
        return;
      }
      if (res.status === 409) {
        notifyError("Já existe NFS-e emitida ou em processamento para esta OS.");
      } else {
        notifyError("Erro: " + (j.error || "falha na emissão"));
      }
    } catch {
      notifyError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white";
  const labelCls = "block text-slate-400 font-semibold mb-1";

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h3 className="font-bold text-sm flex items-center gap-2 text-blue-400">
            <FileText className="w-4 h-4" /> Emitir NFS-e
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-5 text-xs">
          <div>
            <label htmlFor="nfse-nome" className={labelCls}>Nome do tomador (quem contrata) *</label>
            <input
              id="nfse-nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="nfse-doctype" className={labelCls}>Tipo</label>
              <select
                id="nfse-doctype"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as "cpf" | "cnpj")}
                className={inputCls}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>
            <div>
              <label htmlFor="nfse-doc" className={labelCls}>{documentType.toUpperCase()} *</label>
              <input
                id="nfse-doc"
                required
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="nfse-email" className={labelCls}>E-mail</label>
              <input
                id="nfse-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="nfse-phone" className={labelCls}>Telefone</label>
              <input
                id="nfse-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(86) 99999-0000"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="nfse-desc" className={labelCls}>Descrição do serviço</label>
            <input
              id="nfse-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="nfse-valor" className={labelCls}>Valor (R$) *</label>
            <input
              id="nfse-valor"
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded disabled:opacity-50"
            >
              {saving ? "Emitindo..." : "Emitir NFS-e"}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            A NFS-e é emitida via FocusNFe e vinculada a esta ordem de serviço. Configure o provedor em Configurações {'>'} Fiscal.
          </p>
        </form>
      </div>
    </div>
  );
}