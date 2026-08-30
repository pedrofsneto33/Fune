import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getTenantId(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      const { data: roleRecord } = await supabaseAdmin.from('user_roles').select('tenant_id').eq('user_id', user.id).maybeSingle();
      if (roleRecord?.tenant_id) return roleRecord.tenant_id;
    }
  }
  const { data: t } = await supabaseAdmin.from('tenants').select('id').limit(1).maybeSingle();
  if (t?.id) return t.id;
  const { data: newT } = await supabaseAdmin.from('tenants').insert([{ name: 'Funerária Matriz', cnpj: '00.000.000/0001-00' }]).select('id').single();
  return newT?.id || '00000000-0000-0000-0000-000000000000';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
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
        dependents ( id, full_name, relation ),
        contracts (
          id,
          status,
          start_date,
          plans ( id, name, monthly_fee )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, cpf, phone, email, address, plan_name, monthly_fee } = body;

    if (!full_name || !cpf || !phone) {
      return NextResponse.json({ error: 'Nome, CPF e Telefone são obrigatórios.' }, { status: 400 });
    }

    const tenantId = await getTenantId(req);

    const { data: holder, error: holderError } = await supabaseAdmin
      .from('holders')
      .insert([{
        tenant_id: tenantId,
        full_name: full_name.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
      }])
      .select()
      .single();

    if (holderError) {
      return NextResponse.json({ error: holderError.message }, { status: 500 });
    }

    let planId = null;
    const { data: existingPlan } = await supabaseAdmin.from('plans').select('id').eq('tenant_id', tenantId).limit(1).maybeSingle();
    if (existingPlan?.id) {
      planId = existingPlan.id;
    } else {
      const { data: newP } = await supabaseAdmin.from('plans').insert([{
        tenant_id: tenantId,
        name: plan_name || 'Familiar Ouro',
        monthly_fee: monthly_fee || 69.90,
        max_dependents: 6,
      }]).select('id').single();
      planId = newP?.id;
    }

    if (planId && holder) {
      await supabaseAdmin.from('contracts').insert([{
        tenant_id: tenantId,
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
}
