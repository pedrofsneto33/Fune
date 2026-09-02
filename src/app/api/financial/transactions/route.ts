import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("financial_transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("transaction_date", { ascending: false })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const body = await req.json();
  const { description, amount, type, category, transaction_date } = body;
  if (!description || !amount || !type) {
    return NextResponse.json({ error: "Descricao, valor e tipo sao obrigatorios" }, { status: 400 });
  }
  if (!["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "Tipo deve ser 'income' ou 'expense'" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("financial_transactions")
    .insert({
      tenant_id: tenantId,
      description,
      amount: parseFloat(amount),
      type,
      category: category || "Outros",
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
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
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
