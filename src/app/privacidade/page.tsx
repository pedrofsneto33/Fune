import { MarkdownLegal } from '@/components/legal/MarkdownLegal';
import { conteudo } from '@/content/legal/privacidade';

export const metadata = {
  title: 'Politica de Privacidade — EternityOS',
  description: 'Politica de privacidade da plataforma EternityOS.',
};

export default function PrivacidadePage() {
  return <MarkdownLegal content={conteudo} />;
}