'use client';

import { useState } from 'react';
import { canonicalCarteirinhaPath, maskCpf } from '@/lib/carteirinhaToken';

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

  const handleCopy = async () => {
    // window só existe no browser — por isso a URL é montada no clique
    const base = (
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    ).replace(/\/+$/, '');
    const url = base + canonicalCarteirinhaPath(cpf, token);

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
    <button
      type="button"
      onClick={handleCopy}
      title={titulo}
      aria-label={titulo}
      className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-[11px] font-semibold whitespace-nowrap"
    >
      🪪 {copiado ? 'Link copiado!' : erro ? 'Falha ao copiar' : 'Carteirinha'}
    </button>
  );
}
