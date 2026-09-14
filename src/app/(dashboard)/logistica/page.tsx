// Duplicacao temporaria da fase 4d-1 (NAO existe codigo em page.tsx para copiar —
// UI nova para APIs orfas: dispatches/close, dispatches/audit e collector-routes).
// Resolvida quando o monolito for removido na Fase 6.
// Escopo 4d-1: missoes (fechar + auditoria) e rotas de coletor.

import LogisticsTab from "@/components/tabs/LogisticsTab";

export default function LogisticaPage() {
  return <LogisticsTab />;
}