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
    const body = await req.json();
    const {
      tenant_id,
      contract_id,
      holder_id,
      holder_name,
      holder_cpf,
      holder_email,
      holder_phone,
      total_value,
      installment_count = 1,
      first_due_date,
      description
    } = body;

    if (!tenant_id || !holder_name || !holder_cpf || !total_value || !first_due_date) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (tenant_id, holder_name, holder_cpf, total_value, first_due_date).' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Obter credenciais do Asaas do tenant
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('asaas_api_key, asaas_wallet_id, name')
      .eq('id', tenant_id)
      .single();

    if (tErr || !tenant?.asaas_api_key) {
      return NextResponse.json(
        { error: 'Credencial Asaas API Key não configurada para esta filial.' },
        { status: 400 }
      );
    }

    const asaasApiKey = tenant.asaas_api_key;
    const isProd = asaasApiKey.startsWith('$aact_prod_') || !asaasApiKey.includes('test');
    const asaasBaseUrl = isProd
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // 2. Buscar ou Criar Customer no Asaas
    const cleanCpf = holder_cpf.replace(/\D/g, '');
    let customerId = '';

    const searchCustRes = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${cleanCpf}`, {
      headers: { 'access_token': asaasApiKey }
    });
    const searchCustData = await searchCustRes.json();

    if (searchCustData.data && searchCustData.data.length > 0) {
      customerId = searchCustData.data[0].id;
    } else {
      const createCustRes = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: holder_name,
          cpfCnpj: cleanCpf,
          email: holder_email || undefined,
          mobilePhone: holder_phone ? holder_phone.replace(/\D/g, '') : undefined,
          externalReference: holder_id || contract_id
        })
      });
      const createCustData = await createCustRes.json();
      if (!createCustRes.ok) {
        return NextResponse.json(
          { error: `Erro ao cadastrar cliente no Asaas: ${createCustData.errors?.[0]?.description || JSON.stringify(createCustData)}` },
          { status: 400 }
        );
      }
      customerId = createCustData.id;
    }

    // 3. Gerar Cobrança (Boleto Único ou Carnê Parcelado)
    const chargePayload: any = {
      customer: customerId,
      billingType: 'BOLETO',
      dueDate: first_due_date,
      description: description || (installment_count > 1 ? `Carnê Plano Funerário - ${installment_count}x` : 'Mensalidade Plano Funerário'),
      externalReference: contract_id || holder_id
    };

    if (installment_count > 1) {
      chargePayload.installmentCount = Number(installment_count);
      chargePayload.installmentValue = Number((Number(total_value) / Number(installment_count)).toFixed(2));
    } else {
      chargePayload.value = Number(total_value);
    }

    const chargeRes = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chargePayload)
    });

    const chargeData = await chargeRes.json();
    if (!chargeRes.ok) {
      return NextResponse.json(
        { error: `Erro ao gerar boleto/carnê: ${chargeData.errors?.[0]?.description || JSON.stringify(chargeData)}` },
        { status: 400 }
      );
    }

    // 4. Se for carnê, buscar as parcelas geradas
    let installmentsList: any[] = [];
    let bankSlipUrl = chargeData.bankSlipUrl || chargeData.invoiceUrl;
    let identificationField = chargeData.identificationField || '';

    if (chargeData.installment) {
      const instRes = await fetch(`${asaasBaseUrl}/payments?installment=${chargeData.installment}`, {
        headers: { 'access_token': asaasApiKey }
      });
      const instData = await instRes.json();
      if (instData.data) {
        installmentsList = instData.data;
        bankSlipUrl = installmentsList[0]?.bankSlipUrl || installmentsList[0]?.invoiceUrl || bankSlipUrl;
        identificationField = installmentsList[0]?.identificationField || identificationField;
      }
    }

    // 5. Gravar registros na tabela payments do Supabase
    const paymentsToInsert = installmentsList.length > 0
      ? installmentsList.map((inst) => ({
          tenant_id,
          contract_id,
          amount: inst.value,
          due_date: inst.dueDate,
          status: 'Pendente',
          payment_method: 'BOLETO',
          asaas_payment_id: inst.id,
          bank_slip_url: inst.bankSlipUrl || inst.invoiceUrl,
          identification_field: inst.identificationField
        }))
      : [{
          tenant_id,
          contract_id,
          amount: chargeData.value,
          due_date: chargeData.dueDate,
          status: 'Pendente',
          payment_method: 'BOLETO',
          asaas_payment_id: chargeData.id,
          bank_slip_url: chargeData.bankSlipUrl || chargeData.invoiceUrl,
          identification_field: chargeData.identificationField
        }];

    if (contract_id) {
      await supabase.from('payments').insert(paymentsToInsert);
    }

    return NextResponse.json({
      success: true,
      chargeId: chargeData.id,
      installmentId: chargeData.installment || null,
      installmentCount: installment_count,
      bankSlipUrl,
      identificationField,
      invoiceUrl: chargeData.invoiceUrl,
      installments: paymentsToInsert
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}