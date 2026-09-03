'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ModalBoletoBatchProps {
  isOpen: boolean;
  onClose: () => void;
  holders: any[];
  initialHolderId?: string | null;
  onSuccess?: () => void;
}

export function ModalBoletoBatch({
  isOpen,
  onClose,
  holders = [],
  initialHolderId,
  onSuccess
}: ModalBoletoBatchProps) {
  const [selectedHolderId, setSelectedHolderId] = useState<string>(initialHolderId || (holders[0]?.id || ''));
  const [installments, setInstallments] = useState<number>(12);
  const [startMonth, setStartMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [asaasLoading, setAsaasLoading] = useState(false);
  const [asaasMessage, setAsaasMessage] = useState<{ type: 'error' | 'success'; text: string; boletos?: any[] } | null>(null);
  const [expandedParcel, setExpandedParcel] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHolder = holders.find(h => h.id === selectedHolderId) || holders[0];

  const handleCopyPix = (pixCode: string, id: string) => {
    navigator.clipboard.writeText(pixCode);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 1. Carnê Físico A4
  const handlePrintPhysicalCarne = () => {
    if (!currentHolder) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    let slipsHtml = '';

    for (let i = 0; i < installments; i++) {
      const currentMonthIndex = (startMonth - 1 + i) % 12;
      const currentYearCalc = year + Math.floor((startMonth - 1 + i) / 12);
      const dueDate = `10/${String(currentMonthIndex + 1).padStart(2, '0')}/${currentYearCalc}`;
      const parcelNumber = `${String(i + 1).padStart(2, '0')}/${String(installments).padStart(2, '0')}`;

      slipsHtml += `
        <div class="carne-slip">
          <div class="stub">
            <div class="brand">ETERNITY OS</div>
            <div class="title">RECIBO DO CAIXA</div>
            <div class="field"><span class="lbl">Parcela:</span> <strong>${parcelNumber}</strong></div>
            <div class="field"><span class="lbl">Vencimento:</span> <strong>${dueDate}</strong></div>
            <div class="field"><span class="lbl">Valor:</span> <strong>${currentHolder.amount}</strong></div>
            <div class="field"><span class="lbl">Associado:</span> ${currentHolder.holder}</div>
            <div class="field"><span class="lbl">CPF:</span> ${currentHolder.cpf}</div>
            <div class="field"><span class="lbl">Contrato:</span> ${currentHolder.id.slice(0, 8).toUpperCase()}</div>
            <div class="signature-line">Autenticação Mecânica / Visto</div>
          </div>

          <div class="main-slip">
            <div class="header-slip">
              <div>
                <strong style="font-size: 14px; letter-spacing: 1px;">ETERNITY PLANOS DE ASSISTÊNCIA</strong>
                <div style="font-size: 10px; color: #555;">Central de Atendimento 24 Horas: 0800 000 0000</div>
              </div>
              <div style="text-align: right;">
                <span class="badge">CARNÊ DE PAGAMENTO</span>
                <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Parcela: ${parcelNumber}</div>
              </div>
            </div>

            <div class="grid-fields">
              <div class="box">
                <span class="lbl">ASSOCIADO / BENEFICIÁRIO</span>
                <div class="val">${currentHolder.holder}</div>
                <div style="font-size: 10px; color: #555;">CPF: ${currentHolder.cpf} | Plano: ${currentHolder.plan}</div>
              </div>
              <div class="box">
                <span class="lbl">VENCIMENTO</span>
                <div class="val text-red">${dueDate}</div>
              </div>
              <div class="box">
                <span class="lbl">VALOR DA PARCELA</span>
                <div class="val text-green">${currentHolder.amount}</div>
              </div>
            </div>

            <div class="footer-slip">
              <div style="font-size: 9px; color: #666; line-height: 1.3;">
                • Pagável nos escritórios da empresa, com cobradores autorizados ou via Chave PIX.<br/>
                • O não pagamento até o vencimento sujeita a suspensão temporária dos benefícios previstos em contrato.
              </div>
              <div class="code-area">
                <div class="pix-tag">CHAVE PIX CNPJ</div>
                <div style="font-size: 9px; font-family: monospace;">00.000.000/0001-00</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carnê de Pagamento - ${currentHolder.holder}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; }
          .carne-slip {
            display: flex;
            border: 1px dashed #444;
            margin-bottom: 8mm;
            page-break-inside: avoid;
            height: 84mm;
            box-sizing: border-box;
          }
          .stub {
            width: 32%;
            border-right: 1px dashed #777;
            padding: 8px 10px;
            box-sizing: border-box;
            background: #fafafa;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .main-slip {
            width: 68%;
            padding: 8px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .brand { font-size: 11px; font-weight: 900; letter-spacing: 1px; }
          .title { font-size: 9px; font-weight: bold; color: #555; margin-bottom: 4px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
          .field { font-size: 10px; margin-bottom: 3px; line-height: 1.2; }
          .lbl { font-size: 8px; color: #666; text-transform: uppercase; display: block; font-weight: bold; }
          .signature-line { font-size: 8px; color: #888; border-top: 1px solid #aaa; text-align: center; padding-top: 3px; margin-top: 4px; }
          .header-slip { display: flex; justify-content: space-between; border-bottom: 2px solid #222; padding-bottom: 4px; }
          .badge { background: #222; color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
          .grid-fields { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px; margin: 6px 0; }
          .box { border: 1px solid #ccc; padding: 4px 6px; border-radius: 4px; background: #fff; }
          .val { font-size: 11px; font-weight: bold; }
          .text-red { color: #b91c1c; font-size: 12px; }
          .text-green { color: #047857; font-size: 12px; }
          .footer-slip { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #eee; padding-top: 4px; }
          .code-area { border: 1px solid #047857; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; text-align: center; }
          .pix-tag { font-size: 8px; font-weight: bold; color: #047857; }
        </style>
      </head>
      <body>
        ${slipsHtml}
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 2. Extrato Financeiro
  const handlePrintStatement = () => {
    if (!currentHolder) return;
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Extrato do Contrato - ${currentHolder.holder}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
          h2 { margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h2>Demonstrativo de Cobrança Anual</h2>
        <p><strong>Associado:</strong> ${currentHolder.holder} | <strong>CPF:</strong> ${currentHolder.cpf} | <strong>Plano:</strong> ${currentHolder.plan}</p>
        <hr/>
        <table>
          <thead>
            <tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status Previsto</th></tr>
          </thead>
          <tbody>
            ${Array.from({ length: installments }, (_, i) => {
              const m = (startMonth - 1 + i) % 12;
              const y = year + Math.floor((startMonth - 1 + i) / 12);
              return `<tr>
                <td>Parcela ${i + 1}/${installments}</td>
                <td>10/${String(m + 1).padStart(2, '0')}/${y}</td>
                <td>${currentHolder.amount}</td>
                <td>Em Aberto</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 3. Emissão Registrada Asaas
  const handleGenerateAsaasBatch = async () => {
    setAsaasLoading(true);
    setAsaasMessage(null);

    try {
      const res = await fetch('/api/billing/asaas-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holderId: currentHolder.holderId || currentHolder.id,
          installments,
          startMonth,
          year
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Credencial Asaas API Key não configurada.');
      }

      setAsaasMessage({
        type: 'success',
        text: `Lote de ${installments} parcelas gerado com sucesso no gateway!`,
        boletos: data.boletos || []
      });
    } catch (err: any) {
      setAsaasMessage({ type: 'error', text: err.message || 'Falha na comunicação com gateway.' });
    } finally {
      setAsaasLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Central de Emissão de Carnês & Boletos</h2>
              <p className="text-xs text-zinc-400">Emissão gráfica física ou registro bancário automatizado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Seleção do Titular */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Selecione o Titular / Contrato *</label>
            <select
              value={selectedHolderId}
              onChange={(e) => {
                setSelectedHolderId(e.target.value);
                setAsaasMessage(null);
                setExpandedParcel(null);
              }}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {holders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.holder} ({h.cpf}) — {h.plan} — {h.amount}
                </option>
              ))}
            </select>
          </div>

          {/* Parâmetros */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Nº de Parcelas</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value={6}>6 Parcelas (Semestral)</option>
                <option value={12}>12 Parcelas (Anual)</option>
                <option value={24}>24 Parcelas (Bienal)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Mês Inicial</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Ano de Início</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Resumo do Contrato */}
          {currentHolder && (
            <div className="bg-slate-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Titular:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentHolder.holder}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Valor Unitário:</span>
                <span className="font-bold text-emerald-400">{currentHolder.amount} / mês</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total do Bloco ({installments} parcelas):</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  R$ {(parseFloat((currentHolder.amount || '').replace(/[^0-9,-]/g, '').replace(',', '.') || 0) * installments).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          {/* Feedback Visual Asaas com Detalhamento de QR Code & Chave Copia e Cola */}
          {asaasMessage && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-3 ${
                asaasMessage.type === 'error'
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {asaasMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                )}
                <div>
                  <p className="font-bold text-sm">{asaasMessage.text}</p>
                  {asaasMessage.type === 'success' && asaasMessage.boletos && (
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">
                      Clique em qualquer parcela abaixo para expandir o QR Code e a chave Pix Copia e Cola.
                    </p>
                  )}
                </div>
              </div>

              {/* Lista interativa das parcelas geradas */}
              {asaasMessage.type === 'success' && asaasMessage.boletos && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {asaasMessage.boletos.map((b: any) => {
                    const isExpanded = expandedParcel === b.installment;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(b.pixQrCode)}`;

                    return (
                      <div
                        key={b.installment}
                        className="bg-slate-50 dark:bg-zinc-950 border border-emerald-900/60 rounded-xl overflow-hidden transition"
                      >
                        {/* Linha Resumo da Parcela */}
                        <div
                          onClick={() => setExpandedParcel(isExpanded ? null : b.installment)}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-emerald-950/40 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              {String(b.installment).padStart(2, '0')}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs">Parcela {b.installment} de {installments}</p>
                              <p className="text-[10px] text-zinc-400">Vencimento: {b.dueDate.split('-').reverse().join('/')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-emerald-400 font-bold text-xs">
                              R$ {Number(b.amount).toFixed(2).replace('.', ',')}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        </div>

                        {/* Bloco Expandido com QR Code e Copia e Cola */}
                        {isExpanded && (
                          <div className="p-4 border-t border-emerald-900/40 bg-slate-50 dark:bg-zinc-950/80 flex flex-col md:flex-row items-center gap-4 animate-fadeIn">
                            {/* Imagem do QR Code */}
                            <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                              <img
                                src={qrUrl}
                                alt="QR Code PIX"
                                className="w-32 h-32 object-contain"
                              />
                            </div>

                            {/* Detalhes e Ação Copiar */}
                            <div className="flex-1 space-y-2.5 w-full">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                                  PIX Copia e Cola
                                </span>
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 break-all select-all">
                                  {b.pixQrCode}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCopyPix(b.pixQrCode, `pix-${b.installment}`)}
                                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                >
                                  {copiedKey === `pix-${b.installment}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" /> Chave Copiada!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" /> Copiar Código PIX
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modalidades de Emissão */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Opções de Processamento:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handlePrintPhysicalCarne}
                className="p-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:text-white text-left transition shadow-lg shadow-blue-950/30 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Printer className="w-4 h-4" /> Carnê Gráfico A4
                  </span>
                  <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded font-mono">Imediato</span>
                </div>
                <p className="text-[11px] text-blue-100">
                  Lâminas com canhotos de autenticação para cobrança manual e pagamento via PIX.
                </p>
              </button>

              <button
                onClick={handlePrintStatement}
                className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-left transition border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <FileText className="w-4 h-4 text-emerald-400" /> Extrato Financeiro
                  </span>
                  <span className="text-[10px] bg-slate-300 dark:bg-zinc-700 px-2 py-0.5 rounded font-mono text-zinc-700 dark:text-zinc-300">PDF</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Demonstrativo com o cronograma das parcelas para prestação de contas.
                </p>
              </button>
            </div>

            <button
              onClick={handleGenerateAsaasBatch}
              disabled={asaasLoading}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-white transition flex items-center justify-between text-xs disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Registrar Lote e Gerar Chaves PIX / Boletos</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono font-bold">
                {asaasLoading ? 'Processando...' : 'Executar Registro'}
              </span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
