import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, isValidUUID } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/sellers — lista vendedores do tenant
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabaseAdmin
      .from('sellers')
      .select('id, name, phone, whatsapp, commission_percent, active, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true });

    if (activeOnly) query = query.eq('active', true);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Erro ao buscar vendedores' }, { status: 500 });
    return NextResponse.json({ success: true, sellers: data || [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial', 'attendant']);

// POST /api/sellers — cria vendedor (somente gestores)
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const name = sanitizeString(body.name, 150);
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nome do vendedor é obrigatório (mínimo 2 caracteres).' }, { status: 400 });
    }

    const commission = body.commission_percent !== undefined && body.commission_percent !== null && body.commission_percent !== ''
      ? Number(body.commission_percent)
      : 0;
    if (commission < 0 || commission > 100 || Number.isNaN(commission)) {
      return NextResponse.json({ error: 'Comissão deve ser entre 0 e 100.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert({
        tenant_id: auth.tenantId,
        name: name.trim(),
        phone: body.phone ? sanitizeString(body.phone, 20) : null,
        whatsapp: body.whatsapp ? sanitizeString(body.whatsapp, 20) : null,
        commission_percent: commission,
        active: body.active !== undefined ? !!body.active : true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Erro ao criar vendedor' }, { status: 500 });
    return NextResponse.json({ success: true, seller: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);

// PATCH /api/sellers — editar vendedor (allowlist de campos, tenant-scoped)
export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, name, phone, whatsapp, commission_percent, active } = body;
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const n = sanitizeString(name, 150);
      if (!n || n.length < 2) return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres.' }, { status: 400 });
      updateData.name = n.trim();
    }
    if (phone !== undefined) updateData.phone = phone ? sanitizeString(phone, 20) : null;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp ? sanitizeString(whatsapp, 20) : null;
    if (commission_percent !== undefined) {
      const v = Number(commission_percent);
      if (Number.isNaN(v) || v < 0 || v > 100) return NextResponse.json({ error: 'Comissão deve ser entre 0 e 100.' }, { status: 400 });
      updateData.commission_percent = v;
    }
    if (active !== undefined) updateData.active = !!active;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
      return NextResponse.json({ error: 'Erro ao atualizar vendedor' }, { status: 500 });
    }
    return NextResponse.json({ success: true, seller: data });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);

// DELETE /api/sellers?id= — exclusão (ou inativação via PATCH)
export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('sellers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId);

    if (error) return NextResponse.json({ error: 'Erro ao excluir vendedor' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);