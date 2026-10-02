'use client';

import { useState } from 'react';
import { canonicalCarteirinhaPath, maskCpf } from '@/lib/carteirinhaToken';
import { resolvePublicBaseUrl } from '@/lib/publicUrl';

interface CarteirinhaButtonProps {
  cpf: string;
  token: string;
  nome?: string;
}

/**
 * Botão da carteirinha digital (restaurado da refatoração 6g).
 *
 * Gera e copia o link público `/carteirinha/<cpf>?t=<carteirinha_token>`.
 * O token é a única credencial: sem ele a rota responde a mensagem genérica
 * de "não localizada" (P0-2), então o botão não aparece sem token.
 */
export default function CarteirinhaButton({
  cpf,
  token,
  nome,
}: CarteirinhaButtonProps) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState(false);

  // Token ausente: role sem acesso ao campo ou holder ainda não migrado
  if (!token) return null;

  // cpf pode vir undefined em roles sem acesso ao campo (visao operacional)
  const cpfLabel = maskCpf(cpf);
  const titulo =
    `Copiar link da carteirinha de ${nome || 'titular'}` +
    (cpfLabel === '-' ? '' : ` (${cpfLabel})`);

  // Link publico montado uma vez: o mesmo vai para o href e para a copia.
  // O token e a unica credencial; o CPF no path e cosmetico.
  const link =
    resolvePublicBaseUrl().replace(/\/+$/, '') +
    canonicalCarteirinhaPath(cpf, token);

  const handleCopy = async () => {
    // window so existe no browser - por isso a URL e montada no clique
    const url = link;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback para contexto não seguro (http em IP de rede local)
        const area = document.createElement('textarea');
        area.value = url;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setErro(false);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
      setErro(true);
      window.setTimeout(() => setErro(false), 2000);
    }
  };

  return (
    <>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir carteirinha de ${nome || 'titular'}`}
        aria-label={`Abrir carteirinha de ${nome || 'titular'}`}
        className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1"
      >
        🪪 Abrir
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={titulo}
        aria-label={titulo}
        className="ml-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-[11px] leading-none"
      >
        {copiado ? '✓' : erro ? '✕' : '📋'}
      </button>
    </>
  );
}
