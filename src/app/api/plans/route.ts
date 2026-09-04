import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, isValidUUID } from '@/lib/validation';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true });
    if (error) return NextResponse.json({ error: 'Erro ao buscar planos' }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { name, monthly_fee, max_dependents, description } = body;
    if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Nome do plano e obrigatório (mínimo 2 caracteres)' }, { status: 400 });
    if (monthly_fee === undefined || monthly_fee === null || Number(monthly_fee) < 0) return NextResponse.json({ error: 'Mensalidade deve ser um valor positivo' }, { status: 400 });
    if (max_dependents !== undefined && (!Number.isInteger(Number(max_dependents)) || Number(max_dependents) < 0)) return NextResponse.json({ error: 'Limite de dependentes deve ser um número inteiro positivo' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('plans').insert({ tenant_id: auth.tenantId, name: sanitizeString(name, 150), monthly_fee: Number(monthly_fee), max_dependents: max_dependents !== undefined ? Number(max_dependents) : 4, description: description ? sanitizeString(description, 500) : null }).select().single();
    if (error) { if ((error as any).code === '23505') return NextResponse.json({ error: 'Ja existe um plano com este nome' }, { status: 409 }); return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 }); }
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }); }
}, ['superadmin', 'admin', 'manager']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, name, monthly_fee, max_dependents, description } = body;
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const updateData: Record<string, any> = {};
    if (name !== undefined) { if (name.trim().length < 2) return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 }); updateData.name = sanitizeString(name, 150); }
    if (monthly_fee !== undefined) { if (Number(monthly_fee) < 0) return NextResponse.json({ error: 'Mensalidade deve ser positiva' }, { status: 400 }); updateData.monthly_fee = Number(monthly_fee); }
    if (max_dependents !== undefined) { if (!Number.isInteger(Number(max_dependents)) || Number(max_dependents) < 0) return NextResponse.json({ error: 'Dependentes deve ser inteiro positivo' }, { status: 400 }); updateData.max_dependents = Number(max_dependents); }
    if (description !== undefined) { updateData.description = description ? sanitizeString(description, 500) : null; }
    if (Object.keys(updateData).length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('plans').update(updateData).eq('id', id).eq('tenant_id', auth.tenantId).select().single();
    if (error) { if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 }); return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 }); }
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }); }
}, ['superadmin', 'admin', 'manager']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const { data: active, error: checkErr } = await supabaseAdmin.from('contracts').select('id').eq('plan_id', id).eq('tenant_id', auth.tenantId).eq('status', 'active').limit(1);
    if (checkErr) return NextResponse.json({ error: 'Erro ao verificar dependências' }, { status: 500 });
    if (active && active.length > 0) return NextResponse.json({ error: 'Não e possível excluir: ha contratos ativos vinculados a este plano.' }, { status: 409 });
    const { error } = await supabaseAdmin.from('plans').delete().eq('id', id).eq('tenant_id', auth.tenantId);
    if (error) return NextResponse.json({ error: 'Erro ao excluir plano' }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Plano excluído com sucesso' });
  } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }); }
}, ['superadmin', 'admin', 'manager']);
