import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('accounts_payable')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('due_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json();
  const { description, amount, due_date, status = 'pendente' } = body;

  if (!description || !amount || !due_date) {
    return NextResponse.json({ error: 'description, amount e due_date são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('accounts_payable')
    .insert([{
      tenant_id: auth.tenantId,
      description,
      amount: parseFloat(amount),
      due_date,
      status,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}, ['superadmin', 'admin', 'financial']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

  const body = await req.json();

  // Allowlist de campos para evitar overwrite de tenant_id e outros
  const { description, amount, due_date, status, payment_method, notes } = body;
  const updateData: Record<string, any> = {};

  if (description !== undefined) updateData.description = description;
  if (amount !== undefined) updateData.amount = parseFloat(amount);
  if (due_date !== undefined) updateData.due_date = due_date;
  if (status !== undefined) updateData.status = status;
  if (payment_method !== undefined) updateData.payment_method = payment_method;
  if (notes !== undefined) updateData.notes = notes;

  const { data, error } = await supabaseAdmin
    .from('accounts_payable')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}, ['superadmin', 'admin', 'financial']);
