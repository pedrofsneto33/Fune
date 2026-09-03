import { NextResponse } from 'next/server';

/**
 * Loga o erro completo no servidor (sem dados sensiveis) e devolve uma
 * resposta generica ao cliente. Evita vazar detalhes internos (mensagens de
 * banco, constraints, stack traces) atraves da API.
 */
export function logError(err: unknown, context?: string): void {
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
          : 'Nao foi possivel concluir a operacao.',
    },
    { status }
  );
}