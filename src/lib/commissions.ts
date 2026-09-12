import { supabaseAdmin } from './supabaseAdmin';

// ============================================================
// COMISSÃO POR VENDEDOR — fonte única (webhook Asaas + retry)
// Regra: 1º pagamento pago do contrato → commission_rate_initial;
//        demais pagamentos → commission_rate_recurring.
// Sem vendedor ou percentual 0 → não gera nada (silenciosamente).
// ============================================================
export async function generateCommission(
  db: typeof supabaseAdmin,
  tenantId: string,
  payment: { id: string; amount: number; contract_id: string },
): Promise<void> {
  try {
    // 1) Buscar contrato com plano e vendedor
    const { data: contract } = await db
      .from("contracts")
      .select("id, seller_name, plan_id, start_date, plans(commission_rate_initial, commission_rate_recurring)")
      .eq("id", payment.contract_id)
      .eq("tenant_id", tenantId)
      .single();

    if (!contract) return;
    const sellerName: string | null = (contract as any)?.seller_name || null;
    const plan = (contract as any)?.plans || null;
    if (!sellerName || !plan) return; // sem vendedor ou sem plano vinculado

    const rateInitial: number = Number(plan.commission_rate_initial) || 0;
    const rateRecurring: number = Number(plan.commission_rate_recurring) || 0;
    if (rateInitial <= 0 && rateRecurring <= 0) return; // plano sem comissão

    // 2) Contar quantos pagamentos pagos esse contrato já tem
    const { count: paidCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", payment.contract_id)
      .eq("tenant_id", tenantId)
      .eq("status", "paid");

    const isFirst = (paidCount || 0) <= 1; // este acabou de ser confirmado
    const rate = isFirst ? rateInitial : rateRecurring;
    if (rate <= 0) return; // recorrente pode ser 0 (só paga na 1ª)

    const commissionAmount = Number(((payment.amount * rate) / 100).toFixed(2));
    if (commissionAmount <= 0) return;

    // 3) Inserir comissão
    await db.from("commissions").insert({
      tenant_id: tenantId,
      contract_id: payment.contract_id,
      seller_name: sellerName,
      amount: commissionAmount,
      status: "pendente",
    });
  } catch {
    // nunca falhar o webhook por causa de comissão
  }
}
