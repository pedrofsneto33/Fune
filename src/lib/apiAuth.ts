import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function verifyApiAuth(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Token de autenticação não fornecido ou inválido', status: 401, user: null };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { error: 'Sessão inválida ou expirada', status: 401, user: null };
    }

    return { error: null, status: 200, user, supabaseAdmin };
  } catch (err: any) {
    return { error: 'Erro interno de autenticação: ' + err.message, status: 500, user: null };
  }
}
