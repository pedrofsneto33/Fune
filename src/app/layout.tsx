import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07090e',
};

export const metadata: Metadata = {
  title: "Eternity OS - ERP Funerário",
  description: "Sistema de Gestão para Empresas Funerárias e Planos de Assistência",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
