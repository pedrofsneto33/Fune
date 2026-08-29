import { supabase } from './supabaseClient';

export async function safeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>, retries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data as T;
    } catch (err: any) {
      attempt++;
      if (attempt >= retries) {
        console.error(`[CRITICAL] Falha na query após ${retries} tentativas:`, err.message);
        throw err;
      }
      await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 300)); // Exponential backoff
    }
  }
  throw new Error('Falha desconhecida na operação de banco de dados.');
}
