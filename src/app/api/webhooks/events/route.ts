import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ============================================================
// LISTAR EVENTOS DE WEBHOOK (admin)
// GET /api/webhooks/events?processed=false&limit=50&offset=0
// - superadmin: vê todos os eventos de todos os tenants
// - admin/manager/financial: vê apenas eventos do seu tenant
// ============================================================

const MAX_LIMIT = 200;

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { searchParams } = new URL(req.url);
  const processedParam = searchParams.get('processed');
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), MAX_LIMIT);
  const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

  let query = supabaseAdmin
    .from('webhook_events')
    .select('id, tenant_id, provider, event, asaas_payment_id, processed, skipped_reason, retry_count, last_retried_at, retry_error, received_at, processed_at')
    .order('received_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtro por tenant: superadmin vê todos, demais só o próprio
  if (auth.role !== 'superadmin') {
    query = query.eq('tenant_id', auth.tenantId);
  }

  // Filtro por status de processamento
  if (processedParam === 'true') {
    query = query.eq('processed', true);
  } else if (processedParam === 'false') {
    query = query.eq('processed', false);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Erro ao listar eventos.' }, { status: 500 });
  }

  // Contagem total para paginação
  let countQuery = supabaseAdmin
    .from('webhook_events')
    .select('id', { count: 'exact', head: true });

  if (auth.role !== 'superadmin') {
    countQuery = countQuery.eq('tenant_id', auth.tenantId);
  }
  if (processedParam === 'true') {
    countQuery = countQuery.eq('processed', true);
  } else if (processedParam === 'false') {
    countQuery = countQuery.eq('processed', false);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    events: data || [],
    total: count || 0,
    limit,
    offset,
  });
}, ['superadmin', 'admin', 'manager', 'financial']);
