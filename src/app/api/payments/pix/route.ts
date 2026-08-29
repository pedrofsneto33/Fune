import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { contractId, customerName, cpf, amount, description } = await req.json();

    if (!amount || !customerName) {
      return NextResponse.json({ error: 'Dados insuficientes para cobrança.' }, { status: 400 });
    }

    const asaasApiKey = process.env.ASAAS_API_KEY;
    const asaasEnv = process.env.ASAAS_ENV || 'sandbox'; // sandbox ou production
    const asaasBaseUrl = asaasEnv === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/v3';

    // Se houver chave Asaas configurada
    if (asaasApiKey) {
      // 1. Criar ou obter cliente
      const customerRes = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify({
          name: customerName,
          cpfCnpj: cpf ? cpf.replace(/\D/g, '') : undefined,
          externalReference: contractId
        })
      });
      const customerData = await customerRes.json();
      const customerId = customerData.id;

      // 2. Criar Cobrança Pix
      const today = new Date().toISOString().split('T')[0];
      const paymentRes = await fetch(`${asaasBaseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: parseFloat(amount),
          dueDate: today,
          description: description || 'Mensalidade Plano Funeral SAAD FUNE',
          externalReference: contractId
        })
      });
      const paymentData = await paymentRes.json();

      // 3. Obter QR Code e Payload Pix
      const qrRes = await fetch(`${asaasBaseUrl}/payments/${paymentData.id}/pixQrCode`, {
        headers: { 'access_token': asaasApiKey }
      });
      const qrData = await qrRes.json();

      return NextResponse.json({
        success: true,
        paymentId: paymentData.id,
        pixCode: qrData.payload,
        qrCodeBase64: qrData.encodedImage,
        gateway: 'asaas'
      });
    }

    // Modo Standalone / Simulação (sem API Key cadastrada ainda)
    const simulatedPixPayload = `00020101021226830014br.gov.bcb.pix2561saadfune.com.br/pix/qr/${contractId || 'mock'}${Date.now()}5204000053039865405${parseFloat(amount).toFixed(2)}5802BR5920SAAD FUNE ASSISTENCIA6008TERESINA62070503***6304ABCD`;

    return NextResponse.json({
      success: true,
      paymentId: `sim_${Date.now()}`,
      pixCode: simulatedPixPayload,
      qrCodeBase64: null,
      gateway: 'simulation'
    });

  } catch (error: any) {
    console.error('Erro ao gerar cobrança Pix:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no gateway' }, { status: 500 });
  }
}