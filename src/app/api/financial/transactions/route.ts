import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidUUID, sanitizeString } from "@/lib/validation";

// ============================================================
// LIVRO CAIXA (financial_transactions) — leitura com filtros + escrita manual.
// Regras:
// - Leitura sempre com isolamento por tenant (auth.tenantId).
// - GET aceita filtros opcionais: ?from=YYYY-MM-DD&to=YYYY-MM-DD
//   &type=income|expense&category=...&limit= (máx. 1000, padrão 500).
// - Para agregações (totais, série mensal), o painel usa
//   GET /api/financial/summary — não deriva de até 500 linhas no client.
// ============================================================

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  if (from && !ISO_DATE.test(from)) {
    return NextResponse.json({ error: "Parâmetro from inválido (use YYYY-MM-DD)" }, { status: 400 });
  }
  if (to && !ISO_DATE.test(to)) {
    return NextResponse.json({ error: "Parâmetro to inválido (use YYYY-MM-DD)" }, { status: 400 });
  }
  if (type && !["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "Parâmetro type inválido (income|expense)" }, { status: 400 });
  }
  const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : DEFAULT_LIMIT, 1), MAX_LIMIT);
  let query = supabaseAdmin
    .from("financial_transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("transaction_date", { ascending: false })
    .limit(limit);
  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", `${to}T23:59:59.999Z`);
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category", sanitizeString(category, 50));
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const body = await req.json();
  const { description, amount, type, category, transaction_date } = body;
  if (!description || !amount || !type) {
    return NextResponse.json({ error: "Descrição, valor e tipo são obrigatórios" }, { status: 400 });
  }
  if (!["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "Tipo deve ser 'income' ou 'expense'" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("financial_transactions")
    .insert({
      tenant_id: tenantId,
      description: sanitizeString(description, 255),
      amount: parseFloat(amount),
      type,
      category: category ? sanitizeString(category, 50) : "Outros",
      transaction_date: transaction_date || new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}, ["admin", "superadmin"]);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("financial_transactions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}, ["admin", "superadmin"]);
