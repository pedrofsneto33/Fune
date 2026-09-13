import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';
import { isValidUUID, sanitizeString } from '@/lib/validation';
import { isHolderActive, isContractActive } from '@/lib/eligibility';

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
// F-25: criação de item no catálogo (find-or-create por nome + código).
    if (action === 'ITEM') {
      const item_name = sanitizeString(body.item_name, 150);
      if (!item_name) {
        return NextResponse.json({ error: 'Nome do equipamento é obrigatório.' }, { status: 400 });
      }

      // Evita duplicata por nome (case-insensitive) dentro do tenant
      const { data: existing } = await supabaseAdmin
        .from('convalescence_items')
        .select('id')
        .eq('tenant_id', tenant_id)
        .ilike('name', item_name)
        .maybeSingle();

      if (existing) {
        const { data: item } = await supabaseAdmin
          .from('convalescence_items')
          .select('*')
          .eq('id', existing.id)
          .maybeSingle();
        return NextResponse.json({ success: true, item });
      }

      const code = 'EQ-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
      const { data: item, error: itemErr } = await supabaseAdmin
        .from('convalescence_items')
        .insert([
          {
            tenant_id,
            code,
            name: item_name,
            status: 'Disponível',
            condition: 'Bom',
          },
        ])
        .select()
        .single();

      if (itemErr) throw itemErr;
      return NextResponse.json({ success: true, item });
    }

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

        // REGRA ÚNICA: empréstimo vinculado a contrato exige titular ativo
        {
          const { data: ownedContract } = await supabaseAdmin
            .from('contracts')
            .select('id, status, holders(status)')
            .eq('id', contract_id)
            .eq('tenant_id', tenant_id)
            .maybeSingle();
          if (!ownedContract) {
            return NextResponse.json({ error: 'Contrato nao encontrado para esta unidade.' }, { status: 404 });
          }
          const cSt = String((ownedContract as any).status ?? '').toLowerCase();
          const hSt = String((ownedContract as any).holders?.status ?? '').toLowerCase();
          // REGRA UNICA centralizada em src/lib/eligibility.ts
          const cOk = isContractActive(cSt);
          const hOk = isHolderActive(hSt);
          if (!cOk || !hOk) {
            return NextResponse.json({ error: 'Este titular/contrato nao esta ativo. Reative antes de liberar o emprestimo.' }, { status: 403 });
          }
        }


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
