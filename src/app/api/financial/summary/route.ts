// ============================================================
// RESUMO FINANCEIRO AGREGADO NO BACKEND (tenant-scoped).
// Resolve o teto de 500 linhas do client: soma TUDO no servidor
// via paginação (lotes de 1000), sem limite de linhas.
// GET /api/financial/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Resposta: { totalIncome, totalExpense, net, incomeByMonth[], avulsoStats }
// - incomeByMonth: [{ ym, month, income, expense, net }] (últimos 12 meses com movimento)
// - avulsoStats: { rows (até 200 mais recentes no período), total, monthTotal, monthCount, count }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AVULSO_CATEGORY = "Serviço Funeral Avulso";
const PAGE_SIZE = 1000;
const MAX_PAGES = 50; // teto de segurança: 50 mil lançamentos por consulta
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface TxRow {
  type: string;
  amount: number | string;
  category: string | null;
  description: string | null;
  transaction_date: string | null;
}

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && !ISO_DATE.test(from)) {
    return NextResponse.json({ error: "Parâmetro from inválido (use YYYY-MM-DD)" }, { status: 400 });
  }
  if (to && !ISO_DATE.test(to)) {
    return NextResponse.json({ error: "Parâmetro to inválido (use YYYY-MM-DD)" }, { status: 400 });
  }

  // Busca TODOS os lançamentos do período em lotes (sem teto de 500).
  const all: TxRow[] = [];
  let truncated = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    let query = supabaseAdmin
      .from("financial_transactions")
      .select("type, amount, category, description, transaction_date")
      .eq("tenant_id", tenantId)
      .order("transaction_date", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (from) query = query.gte("transaction_date", from);
    if (to) query = query.lte("transaction_date", `${to}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    all.push(...(data as TxRow[]));
    if (data.length < PAGE_SIZE) break;
    if (page === MAX_PAGES - 1) truncated = true;
  }

  const ymOf = (d: string | null) => (d || "").slice(0, 7);
  const nowYm = new Date().toISOString().slice(0, 7);

  let totalIncome = 0;
  let totalExpense = 0;
  const byMonth = new Map<string, { income: number; expense: number }>();
  const avulsoRows: Array<{ transaction_date: string | null; description: string | null; amount: number }> = [];
  let avulsoTotal = 0;
  let avulsoMonthTotal = 0;
  let avulsoMonthCount = 0;

  for (const t of all) {
    const v = Number(t.amount) || 0;
    const ym = ymOf(t.transaction_date);
    if (ym) {
      if (!byMonth.has(ym)) byMonth.set(ym, { income: 0, expense: 0 });
      const row = byMonth.get(ym)!;
      if (t.type === "income") {
        row.income += v;
        totalIncome += v;
      } else if (t.type === "expense") {
        row.expense += v;
        totalExpense += v;
      }
    } else if (t.type === "income") {
      totalIncome += v;
    } else if (t.type === "expense") {
      totalExpense += v;
    }
    if (t.category === AVULSO_CATEGORY) {
      avulsoTotal += v;
      avulsoRows.push({
        transaction_date: t.transaction_date,
        description: t.description,
        amount: Math.round(v * 100) / 100,
      });
      if (ym === nowYm) {
        avulsoMonthTotal += v;
        avulsoMonthCount += 1;
      }
    }
  }

  const incomeByMonth = Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([ym, r]) => {
      const [y, m] = ym.split("-");
      return {
        ym,
        month: `${MONTHS_PT[Number(m) - 1] || m}/${y}`,
        income: Math.round(r.income),
        expense: Math.round(r.expense),
        net: Math.round(r.income - r.expense),
      };
    });

  return NextResponse.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    net: Math.round((totalIncome - totalExpense) * 100) / 100,
    count: all.length,
    truncated,
    incomeByMonth,
    avulsoStats: {
      rows: avulsoRows.slice(0, 200),
      total: Math.round(avulsoTotal * 100) / 100,
      monthTotal: Math.round(avulsoMonthTotal * 100) / 100,
      monthCount: avulsoMonthCount,
      count: avulsoRows.length,
    },
  });
}, ["superadmin", "admin", "manager", "financial", "attendant"]);
