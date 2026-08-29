import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key';
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET: Listar itens de patrimônio e empréstimos ativos
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get('tenant_id');

    let itemsQuery = supabase.from('convalescence_items').select('*').order('code');
    let loansQuery = supabase.from('convalescence_loans').select('*, convalescence_items(*)').order('created_at', { ascending: false });

    if (tenant_id && tenant_id !== 'all') {
      itemsQuery = itemsQuery.eq('tenant_id', tenant_id);
      loansQuery = loansQuery.eq('tenant_id', tenant_id);
    }

    const [itemsRes, loansRes] = await Promise.all([itemsQuery, loansQuery]);

    if (itemsRes.error) throw itemsRes.error;

    return NextResponse.json({
      items: itemsRes.data || [],
      loans: loansRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar comodato.' }, { status: 500 });
  }
}

// POST: Realizar novo empréstimo ou devolver item
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { action } = body;

    // 1. AÇÃO: EMPRÉSTIMO
    if (action === 'LOAN') {
      const {
        tenant_id = 'matriz',
        item_id,
        contract_id,
        holder_name,
        holder_cpf,
        holder_phone,
        beneficiary_name,
        expected_return_date,
        deposit_amount = 0,
        cleaning_fee = 0,
        observations
      } = body;

      if (!item_id || !holder_name || !expected_return_date) {
        return NextResponse.json({ error: 'Item, titular e data de devolução são obrigatórios.' }, { status: 400 });
      }

      // Inserir registro de empréstimo
      const { data: loan, error: loanErr } = await supabase
        .from('convalescence_loans')
        .insert([
          {
            tenant_id,
            item_id,
            contract_id,
            holder_name,
            holder_cpf,
            holder_phone,
            beneficiary_name,
            expected_return_date,
            deposit_amount: Number(deposit_amount),
            cleaning_fee: Number(cleaning_fee),
            status: 'Ativo',
            observations
          }
        ])
        .select()
        .single();

      if (loanErr) throw loanErr;

      // Atualizar status do item para Emprestado
      await supabase
        .from('convalescence_items')
        .update({ status: 'Emprestado' })
        .eq('id', item_id);

      return NextResponse.json({ success: true, loan });
    }

    // 2. AÇÃO: DEVOLUÇÃO
    if (action === 'RETURN') {
      const { loan_id, item_id, return_condition = 'Bom', observations } = body;

      if (!loan_id || !item_id) {
        return NextResponse.json({ error: 'Identificadores do empréstimo e item são obrigatórios.' }, { status: 400 });
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Atualizar empréstimo
      const { data: loan, error: lErr } = await supabase
        .from('convalescence_loans')
        .update({
          status: 'Devolvido',
          actual_return_date: todayStr,
          return_condition,
          observations: observations || undefined
        })
        .eq('id', loan_id)
        .select()
        .single();

      if (lErr) throw lErr;

      // Reintegrar item como Disponível
      await supabase
        .from('convalescence_items')
        .update({
          status: return_condition === 'Manutenção' ? 'Manutenção' : 'Disponível',
          condition: return_condition
        })
        .eq('id', item_id);

      return NextResponse.json({ success: true, loan });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar operação de comodato.' }, { status: 500 });
  }
}