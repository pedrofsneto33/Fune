import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateEligibility } from '@/lib/eligibility';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key';
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contract_id,
      holder_id,
      dependent_id,
      death_type = 'natural', // natural | acidental
      custom_grace_days
    } = body;

    if (!contract_id && !holder_id) {
      return NextResponse.json(
        { error: 'Informe contract_id ou holder_id para validação.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Buscar dados do contrato e titular
    let query = supabase.from('contracts').select('*');
    if (contract_id) query = query.eq('id', contract_id);
    else if (holder_id) query = query.eq('holder_id', holder_id);

    const { data: contract, error: cErr } = await query.maybeSingle();

    if (cErr || !contract) {
      return NextResponse.json({
        result: {
          isEligible: false,
          status: 'NAO_ENCONTRADO',
          reason: 'Contrato não localizado na base de dados.',
          daysActive: 0,
          requiredGraceDays: 90,
          pendingGraceDays: 90,
          suggestedExemptionFee: 0,
          isAccidentalDeathExempt: false,
          overduePaymentsCount: 0,
          totalOverdueAmount: 0
        }
      });
    }

    // 2. Se for dependente, buscar data de adesão do dependente
    let dependentIncludedAt = null;
    if (dependent_id) {
      const { data: dep } = await supabase
        .from('dependents')
        .select('created_at, inclusion_date')
        .eq('id', dependent_id)
        .maybeSingle();
      if (dep) {
        dependentIncludedAt = dep.inclusion_date || dep.created_at;
      }
    }

    // 3. Buscar parcelas vencidas e em aberto
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: overdueList } = await supabase
      .from('payments')
      .select('amount, due_date')
      .eq('contract_id', contract.id)
      .in('status', ['Pendente', 'Atrasado'])
      .lt('due_date', todayStr);

    const monthlyValue = Number(contract.monthly_value || contract.amount || 65.0);
    const contractCreatedAt = contract.created_at || contract.start_date || '2025-01-01';

    // 4. Executar cálculo de elegibilidade
    const result = calculateEligibility({
      contractCreatedAt,
      dependentIncludedAt,
      deathType: death_type,
      monthlyValue,
      unpaidOverduePayments: overdueList || [],
      customGraceDaysNatural: custom_grace_days ? Number(custom_grace_days) : 90
    });

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        holder_name: contract.holder_name,
        plan_name: contract.plan_name,
        status: contract.status
      },
      result
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar elegibilidade.' }, { status: 500 });
  }
}