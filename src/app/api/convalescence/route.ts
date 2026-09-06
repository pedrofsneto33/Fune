import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';
import { isValidUUID, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

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
    return serverError(err);
  }
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { action } = body;
    const tenant_id = auth.tenantId;

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

      // SECURITY: validar formato UUID das referencias vindas do cliente

      if (!isValidUUID(item_id)) {

        return NextResponse.json({ error: 'Item invalido.' }, { status: 400 });

      }

      if (contract_id && !isValidUUID(contract_id)) {

        return NextResponse.json({ error: 'Contrato invalido.' }, { status: 400 });

      }

      

      // SECURITY: o item deve pertencer a este tenant

      const { data: ownedItem, error: itemFindErr } = await supabaseAdmin

        .from('convalescence_items')

        .select('id')

        .eq('id', item_id)

        .eq('tenant_id', tenant_id)

        .maybeSingle();

      if (itemFindErr || !ownedItem) {

        return NextResponse.json({ error: 'Item nao encontrado para esta unidade.' }, { status: 404 });

      }

      

      const { data: loan, error: loanErr } = await supabaseAdmin
        .from('convalescence_loans')
        .insert([
          {
            tenant_id,

            item_id,

            contract_id: contract_id || null,

            holder_name: sanitizeString(holder_name, 255),

            holder_cpf: String(holder_cpf || '').replace(/\D/g, '').slice(0, 11) || null,

            holder_phone: sanitizeString(holder_phone || '', 20),

            beneficiary_name: beneficiary_name ? sanitizeString(beneficiary_name, 255) : null,

            expected_return_date,

            deposit_amount: Number(deposit_amount),

            cleaning_fee: Number(cleaning_fee),

            status: 'Ativo',

            observations: observations ? sanitizeString(observations, 1000) : null
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

    if (action === 'RETURN') {
      const { loan_id, item_id, return_condition = 'Bom', observations } = body;

      if (!loan_id || !item_id) {
        return NextResponse.json({ error: 'Identificadores do empréstimo e item são obrigatórios.' }, { status: 400 });
      }

      // SECURITY: validar formato UUID das referencias vindas do cliente

      if (!isValidUUID(loan_id) || !isValidUUID(item_id)) {

        return NextResponse.json({ error: 'Identificador invalido.' }, { status: 400 });

      }

      

      const todayStr = new Date().toISOString().split('T')[0];

      const { data: loan, error: lErr } = await supabaseAdmin
        .from('convalescence_loans')
        .update({
          status: 'Devolvido',
          actual_return_date: todayStr,
          return_condition: sanitizeString(return_condition, 50),
          observations: observations ? sanitizeString(observations, 1000) : undefined
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
          condition: sanitizeString(return_condition, 50)
        })
        .eq('id', item_id)
        .eq('tenant_id', tenant_id);

      return NextResponse.json({ success: true, loan });
    }

    return NextResponse.json({ error: 'Ação invalida.' }, { status: 400 });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);
