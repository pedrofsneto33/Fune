import { MarkdownLegal } from '@/components/legal/MarkdownLegal';
import { conteudo } from '@/content/legal/termos';

export const metadata = {
  title: 'Termos de Uso — EternityOS',
  description: 'Termos de uso da plataforma EternityOS.',
};

export default function TermosPage() {
  return <MarkdownLegal content={conteudo} />;
}