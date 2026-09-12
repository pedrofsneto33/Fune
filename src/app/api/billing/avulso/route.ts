import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { serverError } from "@/lib/http-error";
import { getAsaasConfigForTenant } from "@/lib/asaasClient";
import { sanitizeString, sanitizeCPF, isValidUUID } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limiter";
import { recordIncome } from "@/lib/financial";

// FASE 1 — COBRANÇA AVULSA (não-associado)
// Permite faturar um funeral/serviço para um cliente que NÃO é associado.
// Não exige contract_id (ao contrário de boleto/pix associados): o responsável
// é informado no ato, uma cobrança BOLETO ou PIX é emitida no Asaas e a receita
// é registrada em financial_transactions (categoria "Serviço Funeral Avulso").
export const dynamic = "force-dynamic";

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const rl = checkRateLimit(`avulso:${auth.userId}`, {
        maxAttempts: 5,
        windowMs: 60000,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "Muitas cobranças em sequência. Aguarde um minuto." },
          { status: 429 },
        );
      }

      const body = await req.json().catch(() => ({}));
      const {
        responsavel_nome,
        responsavel_cpf,
        responsavel_phone,
        descricao,
        valor,
        vencimento,
        billingType = "BOLETO",
        service_order_id,
      } = body;

      if (!responsavel_nome || !responsavel_cpf) {
        return NextResponse.json(
          { error: "Nome e CPF do responsável são obrigatórios." },
          { status: 400 },
        );
      }
      const cleanCpf = sanitizeCPF(responsavel_cpf).replace(/\D/g, "");
      if (cleanCpf.length !== 11) {
        return NextResponse.json({ error: "CPF do responsável inválido." }, { status: 400 });
      }
      const amount = Number(valor);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      }
      if (!["BOLETO", "PIX"].includes(billingType)) {
        return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
      }
      if (service_order_id && !isValidUUID(service_order_id)) {
        return NextResponse.json({ error: "Ordem de serviço inválida." }, { status: 400 });
      }
// Se o usuário vinculou uma OS, garante que pertence ao tenant
      if (service_order_id) {
        const { data } = await supabaseAdmin
          .from("service_orders")
          .select("id")
          .eq("id", service_order_id)
          .eq("tenant_id", auth.tenantId)
          .maybeSingle();
        if (!data) {
          return NextResponse.json(
            { error: "Ordem de serviço não encontrada para esta unidade." },
            { status: 404 },
          );
        }
      }

      const asaasConfig = await getAsaasConfigForTenant(auth.tenantId);
      if (!asaasConfig.apiKey) {
        return NextResponse.json(
          { error: "Chave de API do Asaas não configurada para esta unidade. Configure em Configurações." },
          { status: 400 },
        );
      }
      const { baseUrl, apiKey } = asaasConfig;
      const headers = { "Content-Type": "application/json", access_token: apiKey };

      const nome = sanitizeString(responsavel_nome, 120);
      const dueDate =
        vencimento && /^\d{4}-\d{2}-\d{2}$/.test(String(vencimento))
          ? String(vencimento)
          : new Date().toISOString().split("T")[0];
      const desc = sanitizeString(descricao || "Serviço funerário avulso", 200);

      // Timeout em TODAS as chamadas ao Asaas: se a API externa demora, o
      // usuário recebe um erro claro em vez de uma espera infinita.
      const withTimeout = <T>(ms: number, promise: Promise<T>): Promise<T> =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout aguardando resposta do Asaas")), ms)
          ),
        ]);

      // Asaas exige formato internacional para mobilePhone (ex: +5586999990000).
      // Enviar o número nacional cru faz o sandbox devolver 400 (campo inválido).
      let mobilePhone: string | undefined;
      if (responsavel_phone) {
        const digits = String(responsavel_phone).replace(/\D/g, "");
        if (digits.length >= 10) {
          const intl = digits.length >= 13 ? digits : digits.startsWith("55") ? digits : `55${digits}`;
          mobilePhone = `+${intl}`;
        }
      }

      // 1. Localiza ou cadastra o cliente avulso no Asaas (por CPF)
      const searchRes = await withTimeout(15000, fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, {
        headers: { access_token: apiKey },
      }));
      const searchData = await searchRes.json().catch(() => ({}));
      let customerId = searchData?.data?.[0]?.id;
      if (!customerId) {
        const createCustRes = await withTimeout(15000, fetch(`${baseUrl}/customers`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: nome,
            cpfCnpj: cleanCpf,
            mobilePhone,
          }),
        }));
        const createCustData = await createCustRes.json().catch(() => ({}));
        if (createCustData.errors || !createCustData.id) {
          return NextResponse.json(
            { error: "Falha ao cadastrar cliente avulso no Asaas: " + (createCustData.errors?.[0]?.description || "erro desconhecido") },
            { status: 400 },
          );
        }
        customerId = createCustData.id;
      }

      // 2. Cria a cobrança no Asaas
      const paymentRes = await withTimeout(15000, fetch(`${baseUrl}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType,
          value: amount,
          dueDate,
          description: `${desc} - ${nome}`,
        }),
      }));
      const paymentData = await paymentRes.json().catch(() => ({}));
      if (paymentData.errors || !paymentData.id) {
        return NextResponse.json(
          { error: "Falha ao gerar cobrança no Asaas: " + (paymentData.errors?.[0]?.description || "erro desconhecido") },
          { status: 400 },
        );
      }

      // 3. Registra receita no financeiro (sem contract_id; rastreável pelo CPF)
      const txRef = sanitizeString(`${desc} — ${nome}` + (service_order_id ? ` (OS ${service_order_id})` : ""), 255);
      // A cobranca no Asaas ja existe (sem rollback possivel) — mas a receita
      // DEVE entrar no Livro Caixa. Se falhar, sinalizar na resposta para o
      // usuario lancar manualmente em vez de perder o registro em silencio.
      const income = await recordIncome({
        tenantId: auth.tenantId,
        amount,
        category: "Serviço Funeral Avulso",
        description: txRef,
        transactionDate: dueDate,
        serviceOrderId: service_order_id ?? null,
        source: "billing_avulso",
      });
      const financialWarning = income.ok
        ? undefined
        : "ATENCAO: a receita nao foi registrada no Livro Caixa (" + (income.error || "erro") + "). Lance manualmente em Financeiro.";

      let qr: { encodedImage?: string; payload?: string } | null = null;
      if (billingType === "PIX") {
        const qrRes = await withTimeout(15000, fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
          headers: { access_token: apiKey },
        }));
        const qrData = await qrRes.json().catch(() => ({}));
        qr = qrData as { encodedImage?: string; payload?: string } | null;
      }

      return NextResponse.json(
        {
          success: true,
          message: "Cobrança avulsa gerada com sucesso.",
          warning: financialWarning || null,
          payment_id: paymentData.id,
          invoiceUrl: paymentData.bankSlipUrl || paymentData.invoiceUrl || null,
          status: paymentData.status,
          billingType,
          value: amount,
          dueDate,
          pix_qr_code: qr?.payload || null,
          pix_qr_image: qr?.encodedImage || null,
        },
        { status: 201 },
      );
    } catch (err: unknown) {
      return serverError(err);
    }
  },
  ["superadmin", "admin", "financial", "manager"],
);