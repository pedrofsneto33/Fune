import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';
import { isHolderActive, isContractActive } from '@/lib/eligibility';

interface BatchResult {
  contract_id: string;
  holder: string;
  status: 'created' | 'error' | 'skipped';
  asaas_payment_id?: string;
  amount?: number;
  due_date?: string;
  error?: string;
}

// REGRA ÚNICA de elegibilidade: cobra SÓ titular ativo (bilingue ativo/active),
// independente do que estiver no contrato. Contrato com status ativo de um
// titular inativo NÃO gera cobrança.
// REGRA UNICA centralizada em src/lib/eligibility.ts (nao duplicar aqui)
const holderIsInactive = (h: { status?: string | null } | undefined | null) =>
  !h || !isHolderActive(h.status);

// F-23: timeout por chamada externa — sem isso um Asaas lento trava a request
// inteira e a Vercel corta no meio do lote (parcial sem relato).
const ASAAS_TIMEOUT_MS = 15000;
const withTimeout = (ms: number, promise: Promise<Response>) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao chamar o Asaas')), ms),
    ),
  ]);

const contractIsActive = (s: string | null | undefined) => isContractActive(s);

// ─── Fase B: helpers extraidos do loop principal ───
// Cada um retorna um Result; rejeicoes de withTimeout/fetch
// PROPAGAM (o loop externo captura via try/catch e reporta).

type AsaasResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

async function ensureCustomer(
  cleanCpf: string,
  name: string,
  phone: string | undefined,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<AsaasResult<string>> {
  const searchRes = await withTimeout(
    ASAAS_TIMEOUT_MS,
    fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, {
      headers: { access_token: headers['access_token'] },
    }),
  );
  const searchData = await searchRes.json();
  const existing = searchData?.data?.[0]?.id;
  if (existing) return { ok: true, value: existing };

  const createRes = await withTimeout(
    ASAAS_TIMEOUT_MS,
    fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, cpfCnpj: cleanCpf, mobilePhone: phone }),
    }),
  );
  const createData = await createRes.json();
  if (createData.errors) {
    return { ok: false, error: 'Falha ao cadastrar cliente no Asaas' };
  }
  return { ok: true, value: createData.id };
}

async function createAsaasPayment(
  customerId: string,
  billingType: string,
  amount: number,
  dueDate: string,
  description: string,
  contractId: string,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<AsaasResult<string>> {
  const res = await withTimeout(
    ASAAS_TIMEOUT_MS,
    fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType,
        value: amount,
        dueDate,
        description,
        externalReference: contractId,
      }),
    }),
  );
  const data = await res.json();
  if (data.errors) {
    return { ok: false, error: data.errors?.[0]?.description || 'Falha na cobrança' };
  }
  return { ok: true, value: data.id };
}

async function recordLocalPayment(
  tenantId: string,
  contractId: string,
  asaasPaymentId: string,
  amount: number,
  dueDate: string,
  paymentMethod: 'pix' | 'boleto' | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabaseAdmin.from('payments').upsert(
      {
        tenant_id: tenantId,
        contract_id: contractId,
        asaas_payment_id: asaasPaymentId,
        amount,
        due_date: dueDate,
        status: 'pending',
        payment_method: paymentMethod,
      },
      { onConflict: 'asaas_payment_id' },
    );
    if (!error) return { ok: true };
    lastError = error.message;
  }
  // Fase D: cobranca criada no Asaas mas nao registrada localmente.
  // Grava evento de reconciliacao em webhook_events para que o
  // operador possa varrer depois (SELECT event='ORPHAN_PAYMENT').
  // O insert NAO deve mascarar o erro original: se falhar, apenas
  // ignora (ja e um caso de erro).
  try {
    await supabaseAdmin.from('webhook_events').insert({
      tenant_id: tenantId,
      provider: 'internal',
      event: 'ORPHAN_PAYMENT',
      asaas_payment_id: asaasPaymentId,
      processed: false,
      payload: {
        contract_id: contractId,
        amount,
        due_date: dueDate,
        payment_method: paymentMethod,
        upsert_error: lastError,
      },
    });
  } catch {
    // best-effort; nao mascara o erro de upsert original
  }

  return { ok: false, error: lastError || 'Erro desconhecido no upsert' };
}

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // SECURITY: rate limit por usuário - operação em lote de cobranças reais
    const rl = await checkRateLimit(`asabatch:${auth.userId}`, { maxAttempts: 3, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitos lotes em sequência. Aguarde um minuto.' },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const billingType = ['PIX', 'BOLETO', 'UNDEFINED'].includes(body.billingType)
      ? body.billingType
      : 'BOLETO';

    // Data de vencimento: a informada no disparo ou dia 10 do mes seguinte
    let dueDate = '';
    if (body.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      dueDate = body.dueDate;
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(10);
      dueDate = d.toISOString().split('T')[0];
    }

    const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);
    if (!asaasConfig.apiKey) {
      return NextResponse.json(
        { error: 'Chave de API do Asaas não configurada para esta unidade. Configure em Configurações.' },
        { status: 400 },
      );
    }
    const { baseUrl, apiKey } = asaasConfig;

    // Filtra por contrato específico se holderId for enviado, senão pega todos
    let contractsQuery = supabaseAdmin
      .from('contracts')
      .select('id, holder_id, holders(id, full_name, cpf, phone, status), plans(name, monthly_fee)')
      .eq('tenant_id', auth.tenantId);

    // Se um holderId específico foi enviado, filtra apenas o contrato desse titular
    // Usamos holder_id (FK real na tabela contracts) para evitar problemas com filtro em relacionamento
    if (body.holderId) {
      contractsQuery = contractsQuery.eq('holder_id', body.holderId);
    }

    const { data: allContracts, error } = await contractsQuery;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // REGRA ÚNICA de elegibilidade (mesma das carnets):
    //  1. Contrato ativo (bilingue ativo/active)
    //  2. Titular ATIVO (bilingue) — nunca cobrar titular inativo mesmo com contrato ativo
    const contracts = (allContracts || []).filter((c) => {
      if (!contractIsActive((c as any).status)) return false;
      return !holderIsInactive((c as any).holders);
    });

    if (!contracts || contracts.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contrato de titular ativo encontrado para o titular selecionado.' },
        { status: 404 },
      );
    }

    const results: BatchResult[] = [];

    const headers = { 'Content-Type': 'application/json', 'access_token': apiKey };

    for (const c of contracts || []) {
      const holder = (c as any).holders as any;
      const plan = (c as any).plans as any;
      const name = holder?.full_name || 'Associado';
      const cleanCpf = (holder?.cpf || '').replace(/\D/g, '');
      const amount = Number(plan?.monthly_fee) || 0;

      if (!cleanCpf || cleanCpf.length !== 11) {
        results.push({ contract_id: c.id, holder: name, status: 'skipped', error: 'CPF inválido ou ausente' });
        continue;
      }
      if (amount <= 0) {
        results.push({ contract_id: c.id, holder: name, status: 'skipped', error: 'Mensalidade do plano e zero' });
        continue;
      }

      try {
        const phone = holder?.phone ? holder.phone.replace(/\D/g, '') : undefined;
        const customerResult = await ensureCustomer(cleanCpf, name, phone, baseUrl, headers);
        if (!customerResult.ok) {
          results.push({ contract_id: c.id, holder: name, status: 'error', error: customerResult.error });
          continue;
        }

        const description = `Mensalidade ${plan?.name || 'Plano'} - ${name}`;
        const paymentResult = await createAsaasPayment(
          customerResult.value,
          billingType,
          amount,
          dueDate,
          description,
          c.id,
          baseUrl,
          headers,
        );
        if (!paymentResult.ok) {
          results.push({ contract_id: c.id, holder: name, status: 'error', error: paymentResult.error });
          continue;
        }

        const paymentMethod = billingType === 'PIX' ? 'pix' : billingType === 'BOLETO' ? 'boleto' : null;
        const localResult = await recordLocalPayment(
          auth.tenantId,
          c.id,
          paymentResult.value,
          amount,
          dueDate,
          paymentMethod,
        );
        if (!localResult.ok) {
          results.push({
            contract_id: c.id,
            holder: name,
            status: 'error',
            error: `Cobrança criada no Asaas (${paymentResult.value}) mas falha ao registrar localmente: ${localResult.error}`,
          });
          continue;
        }

        results.push({
          contract_id: c.id,
          holder: name,
          status: 'created',
          asaas_payment_id: paymentResult.value,
          amount,
          due_date: dueDate,
        });
      } catch (e: any) {
        results.push({ contract_id: c.id, holder: name, status: 'error', error: e?.message || 'Erro inesperado' });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    const failed = results.filter((r) => r.status === 'error').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      message: `Cobranças ${billingType} no Asaas: ${created} criada(s), ${skipped} ignorada(s), ${failed} com erro. Vencimento: ${dueDate}.`,
      totalProcessed: created,
      created,
      failed,
      skipped,
      dueDate,
      billingType,
      results,
    });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'financial']);