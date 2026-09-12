import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ============================================================
// FONTE ÚNICA DE REGISTRO DE DINHEIRO (Livro Caixa)
// Toda ENTRADA de receita do sistema DEVE passar por recordIncome().
// Nunca escreva direto em financial_transactions fora daqui — um dia
// haverá estorno, conciliação e notificação dependendo deste ponto.
//
// Consumidores atuais:
//   - webhooks/asaas      (mensalidade paga → 'plan_subscription')
//   - payment-carnets     (parcela marcada pago → 'Carne')
//   - billing/avulso      (cobrança avulsa emitida → 'Serviço Funeral Avulso')
// ============================================================

export type IncomeSource =
  | "asaas_webhook"
  | "payment_carnets"
  | "billing_avulso"
  | "manual";

export interface IncomeInput {
  tenantId: string;
  amount: number;
  /** Categoria no Livro Caixa (VARCHAR(50) no banco — truncado aqui por segurança) */
  category: string;
  description: string;
  /** ISO completo ou YYYY-MM-DD (coluna é TIMESTAMPTZ e aceita ambos) */
  transactionDate?: string;
  /** Vincula a receita a um pagamento rastreado (tabela payments), se houver */
  paymentId?: string | null;
  /** Vincula a receita a uma ordem de serviço (rastreabilidade OS ↔ venda avulsa) */
  serviceOrderId?: string | null;
  /** Origem programática, para auditoria na descrição e debug */
  source: IncomeSource;
}

export interface IncomeResult {
  ok: boolean;
  /** Mensagem de erro quando ok=false — o chamador decide como expor ao usuário */
  error?: string;
}

/**
 * Registra uma ENTRADA no Livro Caixa do tenant.
 * Nunca lança: sempre retorna { ok, error } — fluxos de cobrança não podem
 * quebrar por causa do registro contábil (a cobrança já aconteceu).
 */
export async function recordIncome(input: IncomeInput): Promise<IncomeResult> {
  const { tenantId, source } = input;
  const amount = Number(input.amount);

  if (!tenantId) return { ok: false, error: "tenant ausente" };
  if (!amount || amount <= 0) {
    return { ok: false, error: `valor invalido para receita (${amount})` };
  }

  const category = String(input.category || "Outros").slice(0, 50);
  const description = String(input.description || "Receita").slice(0, 255);
  const transactionDate =
    input.transactionDate || new Date().toISOString();

  try {
    const { error } = await supabaseAdmin.from("financial_transactions").insert({
      tenant_id: tenantId,
      payment_id: input.paymentId ?? null,
      service_order_id: input.serviceOrderId ?? null,
      type: "income",
      category,
      amount,
      description: `[${source}] ${description}`.slice(0, 255),
      transaction_date: transactionDate,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message || "erro desconhecido" };
  }
}
