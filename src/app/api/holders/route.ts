import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, sanitizeCPF, isValidEmail, clampNumber } from '@/lib/validation';
import { getPlanByCode, checkHolderLimit } from '@/lib/planLimits';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // SECURITY: Select columns based on role to limit sensitive data exposure
    const isPrivilegedRole = ['superadmin', 'admin', 'financial'].includes(auth.role);
    const isManagerRole = ['superadmin', 'admin', 'manager', 'attendant'].includes(auth.role);

    const { data: holdersList, error } = await supabaseAdmin
      .from('holders')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar titulares' }, { status: 500 });
    }

    // Only fetch related data for roles that need it
    if (isManagerRole && holdersList) {
      const fullData = await Promise.all(holdersList.map(async (h) => {
        const { data: deps } = await supabaseAdmin
          .from('dependents')
          .select('id, full_name, relation')
          .eq('holder_id', h.id)
          .eq('tenant_id', auth.tenantId);
          
        const { data: contracts } = await supabaseAdmin
          .from('contracts')
          .select('id, status, start_date, plans(name, monthly_fee)')
          .eq('holder_id', h.id)
          .eq('tenant_id', auth.tenantId);
          
        return {
          ...h,
          dependents: deps || [],
          contracts: contracts || [],
        };
      }));
      return NextResponse.json(fullData);
    }

    // For non-privileged roles, return limited data
    if (!isPrivilegedRole && holdersList) {
      const limitedData = holdersList.map(h => ({
        id: h.id,
        full_name: h.full_name,
        phone: h.phone,
        created_at: h.created_at,
      }));
      return NextResponse.json(limitedData);
    }

    return NextResponse.json(holdersList || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno ao processar requisição' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    
    // SECURITY: Sanitize and validate inputs
    const full_name = sanitizeString(body.full_name, 255);
    const cpf = sanitizeCPF(body.cpf || '');
    const phone = sanitizeString(body.phone, 20);
    const email = body.email ? sanitizeString(body.email, 254) : null;
    const address = body.address ? sanitizeString(body.address, 500) : null;
    const plan_name = sanitizeString(body.plan_name || 'Plano Familiar Master', 150);
    const monthly_fee = clampNumber(parseFloat(body.monthly_fee) || 69.90, 0, 10000);

    // Validation
    if (!full_name || full_name.length < 2) {
      return NextResponse.json({ error: 'Nome completo é obrigatório (mínimo 2 caracteres).' }, { status: 400 });
    }
    
    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    }
    
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 });
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    // VERIFICACAO DE LIMITE DO PLANO COMERCIAL
    const { data: tenantRow } = await supabaseAdmin
      .from('tenants')
      .select('commercial_plan')
      .eq('id', auth.tenantId)
      .single();
    const plan = getPlanByCode(tenantRow?.commercial_plan);

    const { count: holdersCount } = await supabaseAdmin
      .from('holders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId);
    const limitCheck = checkHolderLimit(plan, holdersCount || 0);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, code: 'PLAN_LIMIT_EXCEEDED', plan: plan.code },
        { status: 402 }
      );
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
