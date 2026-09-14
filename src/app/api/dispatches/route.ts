import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';

// ============================================================
// Despachos / missoes de veiculos
// GET - listar missoes do tenant (ordem de criacao desc)
// (POST de criacao nao existe ainda; a missao nasce de fluxo externo)
// ============================================================

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

    const { data, error } = await supabaseAdmin
      .from('dispatches')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[dispatches GET]', error.message);
      return NextResponse.json({ error: 'Erro ao listar missoes' }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'driver']);