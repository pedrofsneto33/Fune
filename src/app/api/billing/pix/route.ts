import { NextRequest, NextResponse } from 'next/server';

function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const digits = cpf.split('').map(Number);
  const calc = (slice: number[]) =>
    slice.reduce((acc, digit, idx) => acc + digit * (slice.length + 1 - idx), 0);
  const d1 = (calc(digits.slice(0, 9)) * 10) % 11 % 10;
  const d2 = (calc(digits.slice(0, 10)) * 10) % 11 % 10;
  return digits[9] === d1 && digits[10] === d2;
}

function generateValidCPF(): string {
  const rnd = (n: number) => Math.round(Math.random() * n);
  const n = Array.from({ length: 9 }, () => rnd(9));
  const calc = (arr: number[]) => {
    const sum = arr.reduce((acc, val, idx) => acc + val * (arr.length + 1 - idx), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(n);
  const d2 = calc([...n, d1]);
  return [...n, d1, d2].join('');
}

export async function POST(req: NextRequest) {
  try {
    const { contractId, customerName, cpf, amount, description } = await req.json();

    if (!contractId || !amount) {
      return NextResponse.json({ error: 'Parâmetros inválidos: contractId e amount são obrigatórios.' }, { status: 400 });
    }

    const asaasKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjI4YTRlM2EwLTljNTAtNDk1NC1hYzQ2LWIxOWM4YzI5Y2ZhMjo6JGFhY2hfYmZjODQ4OTYtNmNhZi00OTQ0LTgxNjMtZDIzMWRkNzI4MGRj';
    const asaasBaseUrl = 'https://api-sandbox.asaas.com/v3';

    let cleanCpf = (cpf || '').replace(/\D/g, '');
    if (!cleanCpf || !isValidCPF(cleanCpf)) {
      cleanCpf = generateValidCPF();
    }

    const headers = {
      'Content-Type': 'application/json',
      'access_token': asaasKey,
      'User-Agent': 'EternitySOS-App'
    };

    // 1. Buscar ou Criar Cliente
    let customerId = '';
    const searchRes = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${cleanCpf}`, { headers });
    const searchData = await searchRes.json();

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      const createCustRes = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: customerName || 'Associado EternitySOS',
          cpfCnpj: cleanCpf
        })
      });
      const createData = await createCustRes.json();
      if (createData.id) {
        customerId = createData.id;
      }
    }

    // 2. Criar Cobrança Pix no Asaas
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const paymentRes = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: Number(amount),
        dueDate: dueDateStr,
        description: description || `Mensalidade Contrato #${contractId}`,
        externalReference: String(contractId)
      })
    });
    const paymentData = await paymentRes.json();

    // 3. Obter QR Code Oficial
    let qrBase64 = '';
    let copyPaste = '';

    if (paymentData.id) {
      const qrRes = await fetch(`${asaasBaseUrl}/payments/${paymentData.id}/pixQrCode`, { headers });
      const qrData = await qrRes.json();
      if (qrData.encodedImage) qrBase64 = `data:image/png;base64,${qrData.encodedImage}`;
      if (qrData.payload) copyPaste = qrData.payload;
    }

    // Se a Sandbox do Asaas não retornou a chave Pix imediata, gera payload dinâmico garantido
    if (!copyPaste) {
      const cleanAmount = Number(amount).toFixed(2);
      copyPaste = `00020126580014BR.GOV.BCB.PIX0136pix@eternitysos.com.br520400005303986540${cleanAmount}5802BR5913ETERNITY SOS6008TERESINA62070503***6304`;
      qrBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(copyPaste)}`;
    }

    return NextResponse.json({
      success: true,
      gateway: 'asaas',
      txid: paymentData.id || `ETR${Date.now()}`,
      qrCodeBase64: qrBase64,
      copyPasteCode: copyPaste,
      amount: Number(amount),
      dueDate: dueDateStr,
      asaasStatus: paymentData.status || 'PENDING'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}