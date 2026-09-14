// Duplicacao temporaria da fase 6c (aba executive extraida de page.tsx ~2127,
// unica sem equivalente em rota. UI com fetch proprio, sem copiar estado).
// Resolvida quando o monolito for removido na Fase 6d.

import ExecutiveTab from "@/components/tabs/ExecutiveTab";

export default function ExecutivoPage() {
  return <ExecutiveTab />;
}
