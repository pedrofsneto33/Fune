import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('holders')
    .select(`
      id,
      full_name,
      cpf,
      phone,
      email,
      address,
      created_at,
      dependents ( id, full_name, relation, birth_date ),
      contracts (
        id,
        status,
        start_date,
        plans ( id, name, monthly_fee, max_dependents )
      )
    `)
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { full_name, cpf, phone, email, address, plan_name, monthly_fee } = body;

    if (!full_name || !cpf || !phone) {
      return NextResponse.json({ error: 'Nome, CPF e Telefone são obrigatórios.' }, { status: 400 });
    }

    const cleanCpf = cpf.trim();

    const { data: holder, error: holderError } = await supabaseAdmin
      .from('holders')
      .insert([{
        tenant_id: auth.tenantId,
        full_name: full_name.trim(),
        cpf: cleanCpf,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
      }])
      .select()
      .single();

    if (holderError) {
      return NextResponse.json({ error: `Erro ao cadastrar titular: ${holderError.message}` }, { status: 500 });
    }

    let targetPlanId = null;
    const { data: defaultPlan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .limit(1)
      .maybeSingle();

    if (defaultPlan) {
      targetPlanId = defaultPlan.id;
    } else {
      const { data: createdPlan } = await supabaseAdmin
        .from('plans')
        .insert([{
          tenant_id: auth.tenantId,
          name: plan_name || 'Plano Familiar Master',
          monthly_fee: monthly_fee || 69.90,
          max_dependents: 6,
        }])
        .select('id')
        .single();
      targetPlanId = createdPlan?.id;
    }

    if (targetPlanId && holder) {
      await supabaseAdmin
        .from('contracts')
        .insert([{
          tenant_id: auth.tenantId,
          holder_id: holder.id,
          plan_id: targetPlanId,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
        }]);
    }

    return NextResponse.json({ success: true, holder }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);
