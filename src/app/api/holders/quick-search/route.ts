import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  // SECURITY: rate limit por usuário (autocomplete pode ser abusado)
  const rl = checkRateLimit(`qsearch:${auth.userId}`, { maxAttempts: 60, windowMs: 60000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas buscas. Tente novamente em instantes.' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  const cleanCpf = q.replace(/\D/g, '');

  let query = supabaseAdmin
    .from('holders')
    .select(`
      id,
      full_name,
      cpf,
      phone,
      contracts (
        id,
        status,
        start_date,
        plans ( id, name, monthly_fee, max_dependents, description )
      ),
      dependents (
        id,
        full_name,
        cpf,
        relation
      )
    `)
    .eq('tenant_id', auth.tenantId);

  if (cleanCpf.length >= 3) {
    query = query.or(`cpf.ilike.%${cleanCpf}%,full_name.ilike.%${q}%`);
  } else {
    query = query.ilike('full_name', `%${q}%`);
  }

  const { data, error } = await query.limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});
