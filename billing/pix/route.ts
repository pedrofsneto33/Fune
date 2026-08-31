import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { payment_id } = body;

    if (!payment_id) {
      return NextResponse.json({ error: 'payment_id é obrigatório.' }, { status: 400 });
    }

    // 1. Obter os dados do pagamento e titular — só dentro do tenant do usuário logado
    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        amount,
        due_date,
        tenant_id,
        contracts (
          id,
          holders (
            id,
            full_name,
            cpf,
            phone
          )
        )
      `)
      .eq('id', payment_id)
      .eq('tenant_id', auth.tenantId)
      .single();

    if (payError || !payment) {
      return NextResponse.json({ error: 'Pagamento não localizado.' }, { status: 404 });
    }

    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);

    if (!asaasConfig.apiKey) {
      return NextResponse.json({ error: 'Chave do Asaas não configurada para esta unidade.' }, { status: 400 });
    }

    const holder = (payment.contracts as any)?.holders;
    const customerName = holder?.full_name || 'Associado';
    const customerCpf = holder?.cpf?.replace(/\D/g, '') || '00000000000';
    const amount = Number(payment.amount);

    // 2. Criar ou Obter Cliente no Asaas
    const customerRes = await fetch(`${asaasConfig.baseUrl}/customers?cpfCnpj=${customerCpf}`, {
      headers: { 'access_token': asaasConfig.apiKey }
    });
    const customerJson = await customerRes.json();

    let customerId = customerJson?.data?.[0]?.id;

    if (!customerId) {
      const createCustRes = await fetch(`${asaasConfig.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasConfig.apiKey
        },
        body: JSON.stringify({
          name: customerName,
          cpfCnpj: customerCpf,
          phone: holder?.phone || undefined
        })
      });
      const newCust = await createCustRes.json();
      customerId = newCust.id;
    }

    // 3. Criar Cobrança PIX no Asaas
    const chargeRes = await fetch(`${asaasConfig.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasConfig.apiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: amount,
        dueDate: payment.due_date,
        description: `Mensalidade Plano Funeral - Contrato #${(payment.contracts as any)?.id || ''}`,
        externalReference: payment.id
      })
    });

    const chargeData = await chargeRes.json();
    if (!chargeRes.ok || !chargeData.id) {
      return NextResponse.json({ error: chargeData.errors?.[0]?.description || 'Erro ao gerar cobrança no Asaas.' }, { status: 400 });
    }

    // 4. Obter QR Code PIX
    const qrRes = await fetch(`${asaasConfig.baseUrl}/payments/${chargeData.id}/pixQrCode`, {
      headers: { 'access_token': asaasConfig.apiKey }
    });
    const qrData = await qrRes.json();

    // 5. Atualizar pagamento local com dados do Asaas
    await supabaseAdmin
      .from('payments')
      .update({
        asaas_payment_id: chargeData.id,
        pix_qr_code: qrData.encodedImage,
        pix_copy_paste: qrData.payload,
        boleto_url: chargeData.bankSlipUrl || chargeData.invoiceUrl
      })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      encodedImage: qrData.encodedImage,
      payload: qrData.payload,
      expirationDate: qrData.expirationDate,
      invoiceUrl: chargeData.invoiceUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial'])