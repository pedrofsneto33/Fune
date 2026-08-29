import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Obter relatório de comissões por vendedor ou geral
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');

    let query = supabase
      .from('sales_commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Métricas consolidadas
    const totalCommissions = (data || []).reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0);
    const pendingCommissions = (data || []).filter(c => c.status === 'pendente').reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0);
    const paidCommissions = (data || []).filter(c => c.status === 'pago').reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0);

    return NextResponse.json({
      success: true,
      commissions: data || [],
      summary: {
        total: totalCommissions,
        pending: pendingCommissions,
        paid: paidCommissions
      }
    });
  } catch (error: any) {
    console.error('Erro ao consultar comissoes:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// Registrar nova venda com comissão automática
export async function POST(req: NextRequest) {
  try {
    const { sellerId, sellerName, contractId, customerName, planValue, commissionRate } = await req.json();

    if (!sellerName || !planValue) {
      return NextResponse.json({ error: 'Vendedor e valor do plano sao obrigatorios.' }, { status: 400 });
    }

    const numericValue = Number(planValue);
    const rate = Number(commissionRate) || 0.15; // Padrão 15% ou taxa parametrizada
    const commissionAmount = numericValue * rate;

    const { data, error } = await supabase
      .from('sales_commissions')
      .insert([{
        seller_id: sellerId || null,
        seller_name: sellerName,
        contract_id: contractId || null,
        customer_name: customerName || 'Nao informado',
        plan_value: numericValue,
        commission_rate: rate,
        commission_amount: commissionAmount,
        status: 'pendente',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      commission: data
    });
  } catch (error: any) {
    console.error('Erro ao registrar comissao:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// Liquidar/Pagar comissão
export async function PATCH(req: NextRequest) {
  try {
    const { commissionId, status } = await req.json();

    if (!commissionId) {
      return NextResponse.json({ error: 'ID da comissao obrigatorio.' }, { status: 400 });
    }

    const newStatus = status || 'pago';
    const { data, error } = await supabase
      .from('sales_commissions')
      .update({
        status: newStatus,
        paid_at: newStatus === 'pago' ? new Date().toISOString() : null
      })
      .eq('id', commissionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, updated: data });
  } catch (error: any) {
    console.error('Erro ao atualizar repasse:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}