import { NextResponse } from 'next/server';

// GET /api/healthz — healthcheck público (sem auth).
// Uso: uptime monitors (Vercel, BetterStack, cron).
// Retorna 200 + JSON simples. Não toca banco (rápido e sem custo).
export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'eternitysos', ts: new Date().toISOString() },
    { status: 200 },
  );
}
