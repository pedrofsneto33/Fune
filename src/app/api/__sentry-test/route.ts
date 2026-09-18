import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// ROTA TEMPORARIA — testa Sentry end-to-end. Remover apos validacao.
export async function GET() {
  try {
    throw new Error('__SENTRY_SMOKE_TEST__: erro intencional para validar Sentry');
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, sent: true }, { status: 500 });
  }
}
