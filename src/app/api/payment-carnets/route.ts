import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeString, isValidUUID } from '@/lib/validation';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_carnets')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('due_date', { ascending: true })
      .limit(500);
    if (error) return NextResponse.json({ error: 'Erro ao buscar carnês' }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial', 'manager']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const rl = checkRateLimit(`carnet:${auth.userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitos carnês em sequência. Aguarde um minuto.' }, { status: 429 });
    }
    const body = await req.json();
    const { contract_id, holder_name, amount, due_date, installments } = body;
    if (!holder_name || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Nome do associado e valor são obrigatórios.' }, { status: 400 });
    }
    const numInstallments = Math.min(Math.max(installments || 1, 1), 12);
    const installmentValue = Number((Number(amount) / numInstallments).toFixed(2));
    if (contract_id && !isValidUUID(contract_id)) {
      return NextResponse.json({ error: 'Contrato inválido.' }, { status: 400 });
    }
    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);
    const baseUrl = asaasConfig.baseUrl;
    const apiKey = asaasConfig.apiKey;
    const carnetRows = [];
    const firstDueDate = due_date ? new Date(due_date) : new Date();
    for (let i = 0; i < numInstallments; i++) {
      const installmentDate = new Date(firstDueDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      carnetRows.push({
        tenant_id: auth.tenantId,
        contract_id: contract_id || null,
        installment_number: i + 1,
        total_installments: numInstallments,
        due_date: installmentDate.toISOString().split('T')[0],
        amount: installmentValue,
        status: 'pendente',
      });
    }
    const { data: createdCarnets, error: carnetError } = await supabaseAdmin
      .from('payment_carnets')
      .insert(carnetRows)
      .select();
    if (carnetError) {
      return NextResponse.json({ error: 'Erro ao criar carnê: ' + carnetError.message }, { status: 500 });
    }
    const paymentResults = [];
    if (apiKey && contract_id) {
      for (let i = 0; i < numInstallments; i++) {
        const installmentDate = new Date(firstDueDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        const dueDateStr = installmentDate.toISOString().split('T')[0];
        try {
          const paymentRes = await fetch(`${baseUrl}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
            body: JSON.stringify({
              billingType: 'BOLETO',
              value: installmentValue,
              dueDate: dueDateStr,
              description: `Carnê ${sanitizeString(holder_name || '')} - Parcela ${i + 1}/${numInstallments}`,
              externalReference: `${createdCarnets[i]?.id || 'carnet'}_${i + 1}`,
            }),
          });
          const paymentData = await paymentRes.json();
          if (!paymentData.errors) {
            paymentResults.push({ installment: i + 1, paymentId: paymentData.id, dueDate: dueDateStr, value: installmentValue, status: paymentData.status });
          }
        } catch (err) {
          console.error(`Erro ao criar parcela ${i + 1} no Asaas:`, err);
        }
      }
    }
    return NextResponse.json({ success: true, carnets: createdCarnets, payments: paymentResults, totalInstallments: numInstallments, installmentValue, totalAmount: Number(amount) }, { status: 201 });
  } catch (err: any) {
    console.error('Erro na rota payment-carnets:', err);
    return NextResponse.json({ error: 'Erro interno ao processar carnê.' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial', 'manager']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }
    const validStatuses = ['pendente', 'pago', 'atrasado', 'cancelado'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }
    const updateData: any = {};
    if (status) updateData.status = status;
    const { data, error } = await supabaseAdmin
      .from('payment_carnets')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar parcela.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('payment_carnets')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId);
    if (error) {
      return NextResponse.json({ error: 'Erro ao cancelar parcela.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Parcela cancelada.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);
