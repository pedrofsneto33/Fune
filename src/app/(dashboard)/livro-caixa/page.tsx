// Duplicacao temporaria da fase 5b-1 (componente extraido da aba Financeiro
// de page.tsx, Livro Caixa: transacoes com filtros + POST + DELETE).
// /financeiro (5a) permanece intacto — esta rota usa /livro-caixa.
// Resolvida quando o monolito for removido na Fase 6.

import FinancialTab from "@/components/tabs/FinancialTab";

export default function LivroCaixaPage() {
  return <FinancialTab />;
}
