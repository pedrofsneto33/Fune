import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, amount, customerName, customerCpf, customerPhone } = body;

    const apiKey = process.env.ASAAS_API_KEY;
    const isSandbox = process.env.ASAAS_ENV !== 'production';
    const baseUrl = isSandbox 
      ? 'https://sandbox.asaas.com/api/v3' 
      : 'https://api.asaas.com/v3';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave de API do Asaas não configurada no servidor.' },
        { status: 500 }
      );
    }

    const cleanCpf = (customerCpf || '').replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido ou não informado. O Asaas exige CPF regular para emissão de PIX.' },
        { status: 400 }
      );
    }

    // 1. Localizar ou Criar Cliente no Asaas por CPF
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

    // 2. Criar Cobrança PIX
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
        value: Number(amount) || 89.90,
        dueDate: today,
        description: `Mensalidade Plano Funeral - Contrato ${contractId || 'Geral'}`,
        externalReference: contractId || undefined
      })
    });

    const paymentData = await paymentRes.json();

    if (paymentData.errors) {
      return NextResponse.json(
        { error: 'Erro ao gerar cobrança no Asaas', details: paymentData.errors },
        { status: 400 }
      );
    }

    // 3. Obter QR Code PIX Real do Gateway
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
    return NextResponse.json(
      { error: 'Erro interno ao processar cobrança PIX.', details: err.message },
      { status: 500 }
    );
  }
}