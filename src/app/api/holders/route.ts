import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data: holdersList, error } = await supabaseAdmin
      .from('holders')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json([]);

    const fullData = await Promise.all((holdersList || []).map(async (h) => {
      const { data: deps } = await supabaseAdmin.from('dependents').select('*').eq('holder_id', h.id);
      const { data: contracts } = await supabaseAdmin.from('contracts').select('*, plans(*)').eq('holder_id', h.id);
      return {
        ...h,
        dependents: deps || [],
        contracts: contracts || [{ id: '1', status: 'active', start_date: h.created_at, plans: { name: 'Familiar Ouro', monthly_fee: 69.90 } }],
      };
    }));

    return NextResponse.json(fullData);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { full_name, cpf, phone, email, address, plan_name, monthly_fee } = body;

    if (!full_name || !cpf || !phone) {
      return NextResponse.json({ error: 'Nome, CPF e Telefone são obrigatórios.' }, { status: 400 });
    }

    const { data: holder, error: holderError } = await supabaseAdmin
      .from('holders')
      .insert([{
        tenant_id: auth.tenantId,
        full_name: full_name.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
      }])
      .select()
      .single();

    if (holderError) return NextResponse.json({ error: holderError.message }, { status: 500 });

    let planId = null;
    const { data: existingPlan } = await supabaseAdmin.from('plans').select('id').eq('tenant_id', auth.tenantId).limit(1).maybeSingle();
    if (existingPlan?.id) {
      planId = existingPlan.id;
    } else {
      const { data: newP } = await supabaseAdmin.from('plans').insert([{
        tenant_id: auth.tenantId,
        name: plan_name || 'Plano Familiar Master',
        monthly_fee: monthly_fee || 69.90,
        max_dependents: 6,
      }]).select('id').single();
      planId = newP?.id;
    }

    if (planId && holder) {
      await supabaseAdmin.from('contracts').insert([{
        tenant_id: auth.tenantId,
        holder_id: holder.id,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
      }]);
    }

    return NextResponse.json({ success: true, holder }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);
