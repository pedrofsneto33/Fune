import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID } from '@/lib/validation';

// ============================================================
// Despachos de emergencia criados pelo agente de WhatsApp
// GET  - listar chamados do tenant
// PATCH- atualizar status (assumido/rejeitado/encerrado)
// ============================================================

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

  const { data, error } = await supabaseAdmin
    .from('emergency_dispatches')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[emergency-dispatches GET]', error.message);
    return NextResponse.json({ error: 'Erro ao listar chamados' }, { status: 500 });
  }
  return NextResponse.json(data || []);
});

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
  }
  if (!isValidUUID(body.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const allowedStatus = ['Aguardando veiculo', 'Veiculo a caminho', 'Em atendimento', 'Concluido', 'Cancelado'];
  if (body.status && !allowedStatus.includes(body.status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (body.status !== undefined) updateData.status = body.status;

  const { data, error } = await supabaseAdmin
    .from('emergency_dispatches')
    .update(updateData)
    .eq('id', body.id)
    .eq('tenant_id', auth.tenantId)
    .select()
    .single();

  if (error || !data) {
    console.error('[emergency-dispatches PATCH]', error?.message);
    return NextResponse.json({ error: 'Nao foi possivel atualizar o chamado' }, { status: 404 });
  }
  return NextResponse.json(data);
});