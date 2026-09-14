// Duplicacao temporaria de page.tsx (~linha 3142).
// Resolvida quando o monolito for removido na Fase 6.
// Escopo 4c-1: READ-ONLY (GET only). Mutacoes ficam para 4c-2/4c-3.

import Link from 'next/link';
import ServiceOrdersTab from "@/components/tabs/ServiceOrdersTab";

export default function OrdensPage() {
  return (
    <div className="space-y-4">
      <Link href="/ordens/nova" className="inline-block px-4 py-2 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded font-semibold transition">
          + Nova OS
        </Link>
      <ServiceOrdersTab />
    </div>
  );
}