'use client';
import { toast } from 'sonner';

/**
 * Notificacoes nao-bloqueantes (sonner) para substituir alert().
 * Notificacoes no canto da tela nao travam a operacao do plantao.
 */
export function notifySuccess(message: string): void {
  toast.success(message, { duration: 5000 });
}

export function notifyError(message: string): void {
  toast.error(message, { duration: 8000 });
}

export function notifyInfo(message: string): void {
  toast.info(message, { duration: 5000 });
}
