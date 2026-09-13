import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  // SECURITY: rate limit por usuário (autocomplete pode ser abusado)
  const rl = await checkRateLimit(`qsearch:${auth.userId}`, { maxAttempts: 60, windowMs: 60000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas buscas. Tente novamente em instantes.' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  const cleanCpf = q.replace(/\D/g, '');

  // SECURITY: nao interpolamos 'q' em um filtro .or() montado como string —
  // virgula/parenteses no valor do usuario quebrariam ou alterariam a sintaxe
  // PostgREST. Cada busca e construida por metodos parametrizados do
  // supabase-js (injecao impossivel) e os dois resultados sao mesclados em JS.
  const buildBaseQuery = () =>
    supabaseAdmin
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
    const [byCpfRes, byNameRes] = await Promise.all([
      buildBaseQuery().ilike('cpf', `%${cleanCpf}%`).limit(5),
      buildBaseQuery().ilike('full_name', `%${q}%`).limit(5),
    ]);

    if (byCpfRes.error && byNameRes.error) {
      return NextResponse.json({ error: byCpfRes.error.message }, { status: 500 });
    }

    const merged = new Map<string, NonNullable<typeof byCpfRes.data>[number]>();
    for (const row of [...(byCpfRes.data || []), ...(byNameRes.data || [])]) {
      if (row && !merged.has(row.id)) merged.set(row.id, row);
    }
    return NextResponse.json([...merged.values()].slice(0, 5));
  }

  const { data, error } = await buildBaseQuery().ilike('full_name', `%${q}%`).limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});
