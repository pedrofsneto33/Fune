import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';
import { isHolderActive, isContractActive } from '@/lib/eligibility';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { payment_id } = body;

    if (!payment_id) {
      return NextResponse.json({ error: 'payment_id e obrigatório.' }, { status: 400 });
    }

    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        amount,
        due_date,
        tenant_id,
        contracts (
          id,
          status,
          holders (
            id,
            full_name,
            cpf,
            phone,
            status
          )
        )
      `)
      .eq('id', payment_id)
      .eq('tenant_id', auth.tenantId)
      .single();

    if (payError || !payment) {
      return NextResponse.json({ error: 'Pagamento não localizado.' }, { status: 404 });
    }

    // REGRA ÚNICA: só titular ativo com contrato ativo
    const __contract = (payment.contracts as any);
    const __hStatus = String((__contract?.holders?.status) ?? '').toLowerCase();
    const __cStatus = String((__contract?.status) ?? '').toLowerCase();
    // REGRA UNICA centralizada em src/lib/eligibility.ts
    const __contractOk = isContractActive(__cStatus);
    const __holderOk = isHolderActive(__hStatus);
    if (!__contractOk || !__holderOk) {
      return NextResponse.json({ error: 'Este titular/contrato não está ativo. Reative antes de gerar o PIX.' }, { status: 403 });
    }

    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);

    if (!asaasConfig.apiKey) {
      return NextResponse.json({ error: 'Chave do Asaas não configurada para esta unidade.' }, { status: 400 });
    }

    const holder = (payment.contracts as any)?.holders;
    const customerName = holder?.full_name || 'Associado';
    // F-10: nunca enviar CPF invalido ao Asaas — PIX exige CPF real do cliente.
    const customerCpfRaw = String(holder?.cpf || '').replace(/\D/g, '');
    if (customerCpfRaw.length !== 11) {
      return NextResponse.json(
        { error: 'Titular sem CPF valido. Complete o cadastro do associado antes de gerar o PIX.' },
        { status: 400 },
      );
    }
    const customerCpf = customerCpfRaw;
    const amount = Number(payment.amount);

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

    const qrRes = await fetch(`${asaasConfig.baseUrl}/payments/${chargeData.id}/pixQrCode`, {
      headers: { 'access_token': asaasConfig.apiKey }
    });
    const qrData = await qrRes.json();

    // CRITICO: vincula a cobranca Asaas ao pagamento local — sem
    // asaas_payment_id o webhook jamais concilia o dinheiro recebido.
    // Somente colunas que existem no schema (pix_code, pix_qr_code_url).
    const { error: linkErr } = await supabaseAdmin
      .from('payments')
      .update({
        asaas_payment_id: chargeData.id,
        pix_code: qrData.payload || null,
        pix_qr_code_url: qrData.encodedImage || null,
      })
      .eq('id', payment.id)
      .eq('tenant_id', auth.tenantId); // defesa em profundidade: escopo por tenant

    if (linkErr) {
      // Nao engolir: a cobranca ja existe no Asaas — o usuario precisa saber
      // que a vinculacao falhou (senao o pagamento fica orfao no sistema).
      return NextResponse.json(
        { error: 'Cobranca criada no Asaas, mas falha ao vincular ao pagamento local: ' + linkErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      encodedImage: qrData.encodedImage,
      payload: qrData.payload,
      expirationDate: qrData.expirationDate,
      invoiceUrl: chargeData.invoiceUrl
    });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);
