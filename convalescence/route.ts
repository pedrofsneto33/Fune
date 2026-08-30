import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Listar itens de patrimônio e empréstimos ativos
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const itemsQuery = supabaseAdmin.from('convalescence_items').select('*').eq('tenant_id', auth.tenantId).order('code');
    const loansQuery = supabaseAdmin
      .from('convalescence_loans')
      .select('*, convalescence_items(*)')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false });

    const [itemsRes, loansRes] = await Promise.all([itemsQuery, loansQuery]);

    if (itemsRes.error) throw itemsRes.error;

    return NextResponse.json({
      items: itemsRes.data || [],
      loans: loansRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar comodato.' }, { status: 500 });
  }
});

// POST: Realizar novo empréstimo ou devolver item
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { action } = body;
    const tenant_id = auth.tenantId;

    // 1. AÇÃO: EMPRÉSTIMO
    if (action === 'LOAN') {
      const {
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

      const { data: loan, error: loanErr } = await supabaseAdmin
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

      await supabaseAdmin
        .from('convalescence_items')
        .update({ status: 'Emprestado' })
        .eq('id', item_id)
        .eq('tenant_id', tenant_id);

      return NextResponse.json({ success: true, loan });
    }

    // 2. AÇÃO: DEVOLUÇÃO
    if (action === 'RETURN') {
      const { loan_id, item_id, return_condition = 'Bom', observations } = body;

      if (!loan_id || !item_id) {
        return NextResponse.json({ error: 'Identificadores do empréstimo e item são obrigatórios.' }, { status: 400 });
      }

      const todayStr = new Date().toISOString().split('T')[0];

      const { data: loan, error: lErr } = await supabaseAdmin
        .from('convalescence_loans')
        .update({
          status: 'Devolvido',
          actual_return_date: todayStr,
          return_condition,
          observations: observations || undefined
        })
        .eq('id', loan_id)
        .eq('tenant_id', tenant_id)
        .select()
        .single();

      if (lErr) throw lErr;

      await supabaseAdmin
        .from('convalescence_items')
        .update({
          status: return_condition === 'Manutenção' ? 'Manutenção' : 'Disponível',
          condition: return_condition
        })
        .eq('id', item_id)
        .eq('tenant_id', tenant_id);

      return NextResponse.json({ success: true, loan });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar operação de comodato.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);