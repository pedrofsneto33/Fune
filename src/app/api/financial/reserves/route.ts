import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // 1. Buscar todas as transações financeiras consolidadas do tenant
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('financial_transactions')
      .select('type, category, amount, transaction_date')
      .eq('tenant_id', auth.tenantId);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let planSubscriptionIncome = 0;

    (transactions || []).forEach((t) => {
      const val = Number(t.amount || 0);
      if (t.type === 'income') {
        totalIncome += val;
        if (t.category === 'plan_subscription') {
          planSubscriptionIncome += val;
        }
      } else if (t.type === 'expense') {
        totalExpense += val;
      }
    });

    const netCashBalance = totalIncome - totalExpense;

    // 2. Contar contratos ativos e vidas cobertas
    const { count: activeContractsCount } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'active');

    const { count: totalDependentsCount } = await supabaseAdmin
      .from('dependents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId);

    const totalLivesCovered = (activeContractsCount || 0) + (totalDependentsCount || 0);

    // 3. Contar atendimentos/sepultamentos realizados nos últimos 12 meses
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { count: burialsLastYear } = await supabaseAdmin
      .from('chapel_burials')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .gte('burial_date', oneYearAgo.toISOString());

    // 4. Cálculo da Reserva Técnica Regulatória (Lei 13.261/2016)
    // Margem padrão de solvência: 15% sobre as receitas acumuladas de planos
    const reserveRate = 0.15;
    const requiredTechnicalReserve = planSubscriptionIncome * reserveRate;

    // Índice de Solvência: Saldo Líquido em Caixa / Reserva Técnica Mínima
    const solvencyRatio = requiredTechnicalReserve > 0 
      ? Number((netCashBalance / requiredTechnicalReserve).toFixed(2)) 
      : 1.0;

    let solvencyStatus: 'HEALTHY' | 'ADEQUATE' | 'CRITICAL' = 'HEALTHY';
    if (solvencyRatio < 1.0) {
      solvencyStatus = 'CRITICAL';
    } else if (solvencyRatio < 1.25) {
      solvencyStatus = 'ADEQUATE';
    }

    // Taxa de Sinistralidade (% de óbitos sobre vidas cobertas)
    const annualClaimRate = totalLivesCovered > 0 
      ? Number((((burialsLastYear || 0) / totalLivesCovered) * 100).toFixed(2)) 
      : 0;

    return NextResponse.json({
      tenantId: auth.tenantId,
      calculatedAt: new Date().toISOString(),
      financials: {
        totalIncome,
        totalExpense,
        netCashBalance,
        planSubscriptionIncome,
      },
      metrics: {
        activeContracts: activeContractsCount || 0,
        totalLivesCovered,
        burialsLast12Months: burialsLastYear || 0,
        annualClaimRatePercentage: annualClaimRate,
      },
      regulatoryReserves: {
        reserveRatePercentage: reserveRate * 100,
        requiredTechnicalReserve,
        solvencyRatio,
        solvencyStatus,
        isCompliant: netCashBalance >= requiredTechnicalReserve,
      },
    });
  } catch (error: any) {
    console.error('Erro no cálculo de reserva regulatória:', error);
    return NextResponse.json({ error: 'Erro interno ao calcular reserva regulatória.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);
