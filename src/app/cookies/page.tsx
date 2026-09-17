import { MarkdownLegal } from '@/components/legal/MarkdownLegal';
import { conteudo } from '@/content/legal/cookies';

export const metadata = {
  title: 'Aviso de Cookies — EternityOS',
  description: 'Aviso de cookies da plataforma EternityOS.',
};

export default function CookiesPage() {
  return <MarkdownLegal content={conteudo} />;
}