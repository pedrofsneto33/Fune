import type { Metadata } from 'next';
import './globals.css';
import { TenantProvider } from '@/contexts/TenantContext';

export const metadata: Metadata = {
  title: 'Eternity SOS - Gestão Funerária & Planos',
  description: 'Sistema Integrado de Gestão Funerária, Frotas, Plantão 24h e Planos de Assistência Familiar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}