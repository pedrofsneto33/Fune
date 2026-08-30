import { supabaseAdmin } from './supabaseAdmin';
export { withAuth } from './api-handler';
export { supabaseAdmin };
export async function requireAuth(req: any) {
  return { error: null };
}
