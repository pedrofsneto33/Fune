import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { contractId, amount, dueDate } = await req.json();
    if (!contractId || !amount) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('payments').insert([{
      tenant_id: auth.tenantId, contract_id: contractId, amount: Number(amount),
      due_date: dueDate || new Date().toISOString().split('T')[0], status: 'pending', payment_method: 'boleto'
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, payment: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial', 'attendant']);
