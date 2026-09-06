import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID } from '@/lib/validation';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { contractId, amount, dueDate } = await req.json();
    if (!contractId || !amount) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    if (!isValidUUID(contractId)) {

      return NextResponse.json({ error: 'Contrato inválido.' }, { status: 400 });

    }

    // SECURITY: o contrato referenciado deve pertencer a este tenant

    const { data: ownedContract } = await supabaseAdmin

      .from('contracts')

      .select('id')

      .eq('id', contractId)

      .eq('tenant_id', auth.tenantId)

      .maybeSingle();

    if (!ownedContract) {

      return NextResponse.json({ error: 'Contrato não encontrado para esta unidade.' }, { status: 404 });

    }

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
