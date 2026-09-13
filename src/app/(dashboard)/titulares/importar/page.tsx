'use client';

// Duplicacao temporaria de page.tsx. Resolvida na sub-etapa 2e.

import React, { useRef, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';

interface InvalidRow {
  line: number;
  reason: string;
}

interface ImportResult {
  imported: number;
  total?: number;
  invalid?: InvalidRow[];
}

const MAX_LINES = 1000;

export default function ImportarTitularesPage() {
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = importText
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0).length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setImportText(text);
      setResult(null);
    } catch {
      notifyError('Erro ao ler o arquivo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    const csv = importText.trim();
    if (!csv) {
      notifyError('Cole ou carregue um CSV antes de importar.');
      return;
    }
    if (lineCount > MAX_LINES) {
      notifyError(`Limite de ${MAX_LINES} linhas por importacao.`);
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await authFetch('/api/holders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const j = (await res.json().catch(() => ({}))) as ImportResult & {
        error?: string;
      };
      if (res.ok) {
        setResult({
          imported: j.imported ?? 0,
          total: j.total,
          invalid: Array.isArray(j.invalid) ? j.invalid : [],
        });
        notifyInfo(`${j.imported ?? 0} associados importados.`);
      } else {
        notifyError('Erro na importacao: ' + (j.error || 'tente novamente'));
      }
    } catch {
      notifyError('Erro de conexao ao importar.');
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setImportText('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Importar associados</h1>
      <p className="text-sm text-gray-600 mb-6">
        Cole o conteudo CSV ou carregue um arquivo. Formato por linha:
        <code className="mx-1 px-1 bg-gray-100 rounded">
          Nome;CPF;Telefone;Email;Endereco
        </code>
        (delimitador <code>;</code>, <code>,</code> ou Tab). A primeira linha
        pode ser cabecalho.
      </p>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="border rounded px-3 py-2 text-sm"
          disabled={importing}
        >
          Carregar arquivo
        </button>
        <button
          onClick={handleClear}
          className="border rounded px-3 py-2 text-sm"
          disabled={importing || (!importText && !result)}
        >
          Limpar
        </button>
        <span className="text-sm text-gray-600">
          {lineCount} linha{lineCount === 1 ? '' : 's'} (max {MAX_LINES})
        </span>
      </div>

      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder={'Nome;CPF;Telefone;Email;Endereco\nJoao Silva;12345678900;11999999999;joao@ex.com;Rua A, 100'}
        className="w-full h-72 border rounded p-3 font-mono text-sm"
        disabled={importing}
        spellCheck={false}
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleImport}
          disabled={importing || !importText.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          {importing ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {result && (
        <div className="mt-6 border rounded p-4">
          <h2 className="text-lg font-bold mb-3">Resultado</h2>
          <p className="mb-2">
            <strong>{result.imported}</strong> importado
            {result.imported === 1 ? '' : 's'}
            {typeof result.total === 'number' && (
              <> de <strong>{result.total}</strong> linha(s)</>
            )}
            .
          </p>

          {result.invalid && result.invalid.length > 0 && (
            <>
              <p className="mt-3 mb-2 text-red-700">
                {result.invalid.length} linha(s) com erro:
              </p>
              <ul className="list-disc pl-5 text-sm text-red-700 max-h-64 overflow-auto">
                {result.invalid.map((inv, i) => (
                  <li key={i}>
                    Linha {inv.line}: {inv.reason}
                  </li>
                ))}
              </ul>
            </>
          )}

          {(!result.invalid || result.invalid.length === 0) && (
            <p className="text-green-700 text-sm">
              Nenhum erro reportado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}