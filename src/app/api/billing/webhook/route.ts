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

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const rawBody = await req.json();

    const { event, payment } = rawBody;

    if (!event || !payment) {
      return NextResponse.json({ error: 'Payload de webhook inválido.' }, { status: 400 });
    }

    const asaasPaymentId = payment.id;
    const paymentValue = payment.value;
    const netValue = payment.netValue || payment.value;
    const billingType = payment.billingType; // BOLETO, PIX, CREDIT_CARD
    const externalReference = payment.externalReference;
    const clientPaymentDate = payment.clientPaymentDate || payment.paymentDate || new Date().toISOString();

    console.log(`[Webhook Asaas] Evento: ${event} | Payment ID: ${asaasPaymentId}`);

    // Mapeamento de status conforme evento Asaas
    let paymentStatus: string | null = null;
    let contractStatus: string | null = null;

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        paymentStatus = 'Pago';
        contractStatus = 'Ativo';
        break;

      case 'PAYMENT_OVERDUE':
        paymentStatus = 'Atrasado';
        break;

      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        paymentStatus = 'Estornado';
        break;

      case 'PAYMENT_DELETED':
        paymentStatus = 'Cancelado';
        break;

      default:
        return NextResponse.json({ message: `Evento ${event} ignorado sem alteração de estado.` });
    }

    // 1. Atualizar registro na tabela payments pelo asaas_payment_id ou externalReference
    let updatedPayment = null;

    const { data: payByAsaasId, error: findErr } = await supabase
      .from('payments')
      .select('*')
      .eq('asaas_payment_id', asaasPaymentId)
      .maybeSingle();

    if (payByAsaasId) {
      const updateData: any = {
        status: paymentStatus,
        payment_method: billingType || payByAsaasId.payment_method,
        net_value: netValue
      };

      if (paymentStatus === 'Pago') {
        updateData.paid_at = clientPaymentDate;
      }

      const { data: updated, error: uErr } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', payByAsaasId.id)
        .select()
        .single();

      if (!uErr) updatedPayment = updated;
    } else if (externalReference) {
      // Tentar localizar pelo contract_id
      const { data: updated, error: uErr } = await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          asaas_payment_id: asaasPaymentId,
          payment_method: billingType,
          paid_at: paymentStatus === 'Pago' ? clientPaymentDate : null,
          net_value: netValue
        })
        .eq('contract_id', externalReference)
        .eq('status', 'Pendente')
        .order('due_date', { ascending: true })
        .limit(1)
        .select()
        .maybeSingle();

      if (!uErr && updated) updatedPayment = updated;
    }

    // 2. Se o pagamento foi confirmado, atualizar o contrato correspondente
    const targetContractId = updatedPayment?.contract_id || externalReference;
    if (targetContractId && contractStatus === 'Ativo') {
      await supabase
        .from('contracts')
        .update({ status: 'Ativo', last_payment_date: clientPaymentDate })
        .eq('id', targetContractId);
    }

    // 3. Registrar log de auditoria da transação financeira
    const tenantId = updatedPayment?.tenant_id || 'matriz';
    await supabase.from('dispatch_audit_logs').insert([
      {
        tenant_id: tenantId,
        dispatch_id: targetContractId || asaasPaymentId,
        action: `PAGAMENTO_${paymentStatus?.toUpperCase()}`,
        actor_name: 'Webhook Asaas (Automático)',
        actor_role: 'sistema',
        details: {
          event,
          asaas_payment_id: asaasPaymentId,
          amount: paymentValue,
          net_value: netValue,
          billing_type: billingType,
          paid_at: clientPaymentDate
        },
        created_at: new Date().toISOString()
      }
    ]);

    return NextResponse.json({
      success: true,
      event,
      paymentId: asaasPaymentId,
      status: paymentStatus,
      updatedPayment
    });

  } catch (err: any) {
    console.error('[Webhook Asaas Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}