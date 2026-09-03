import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';
import { checkRateLimit } from '@/lib/rate-limiter';
import { serverError } from '@/lib/http-error';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // SECURITY: rate limit por usuario - criacao de cobranca tem custo financeiro
    const rl = checkRateLimit(`pix:${auth.userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas cobrancas em sequencia. Aguarde um minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { contractId, amount, customerName, customerCpf, customerPhone } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valor da cobranca (amount) e obrigatorio e deve ser maior que zero.' },
        { status: 400 }
      );
    }

    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);
    if (!asaasConfig.apiKey) {
      return NextResponse.json(
        { error: 'Chave de API do Asaas nao configurada para esta unidade.' },
        { status: 400 }
      );
    }
    const baseUrl = asaasConfig.baseUrl;
    const apiKey = asaasConfig.apiKey;

    const cleanCpf = (customerCpf || '').replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF invalido ou nao informado. O Asaas exige CPF regular para emissao de PIX.' },
        { status: 400 }
      );
    }

    const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, {
      headers: { 'access_token': apiKey }
    });
    const searchData = await searchRes.json();

    let customerId = searchData?.data?.[0]?.id;

    if (!customerId) {
      const createRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name: customerName || 'Associado Saad Fune',
          cpfCnpj: cleanCpf,
          mobilePhone: customerPhone ? customerPhone.replace(/\D/g, '') : undefined
        })
      });
      const createData = await createRes.json();

      if (createData.errors) {
        return NextResponse.json(
          { error: 'Erro ao cadastrar cliente no Asaas', details: createData.errors },
          { status: 400 }
        );
      }
      customerId = createData.id;
    }

    const today = new Date().toISOString().split('T')[0];
    const paymentRes = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: Number(amount),
        dueDate: today,
        description: `Mensalidade Plano Funeral - Contrato ${contractId || 'Geral'}`,
        externalReference: contractId || undefined
      })
    });

    const paymentData = await paymentRes.json();

    if (paymentData.errors) {
      return NextResponse.json(
        { error: 'Erro ao gerar cobranca no Asaas', details: paymentData.errors },
        { status: 400 }
      );
    }

    const qrRes = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
      headers: { 'access_token': apiKey }
    });
    const qrData = await qrRes.json();

    return NextResponse.json({
      success: true,
      paymentId: paymentData.id,
      netValue: paymentData.netValue,
      payload: qrData.payload,
      encodedImage: qrData.encodedImage,
      expirationDate: qrData.expirationDate
    });

  } catch (err: any) {
    console.error('Erro na rota PIX:', err);
    return serverError(err, 'pix');
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'financial']);
