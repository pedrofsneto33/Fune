import { NextResponse } from 'next/server';

/**
 * Loga o erro completo no servidor (sem dados sensíveis) e devolve uma
 * resposta generica ao cliente. Evita vazar detalhes internos (mensagens de
 * banco, constraints, stack traces) através da API.
 */
export function logError(err: unknown, context?: string): void {
  // Logger central (F-24): console.error concentrado aqui. Rotas e
  // componentes chamam logError() em vez de console direto — facilita
  // plugar Sentry/Datadog depois num ponto único.
  console.error(`[API_ERROR]${context ? ` ${context}` : ''}`, {
    message: err instanceof Error ? err.message : String(err),
  });
}

export function serverError(
  err: unknown,
  context?: string,
  status: number = 500
): NextResponse {
  logError(err, context);
  return NextResponse.json(
    {
      error:
        status === 500
          ? 'Erro interno no servidor. Tente novamente.'
          : 'Não foi possível concluir a operação.',
    },
    { status }
  );
}