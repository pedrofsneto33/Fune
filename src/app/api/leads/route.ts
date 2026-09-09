import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeString, isValidUUID } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limiter";
import { isValidLeadStage, isValidLeadSource } from "@/lib/crm";

export const dynamic = "force-dynamic";

// CRM INTERNO DO OPERADOR — vendas do próprio SaaS EternityOS.
// Leads não são dados de tenant: pertencem a quem vende o sistema.
// Restrito a superadmin; tabela `leads` com RLS sem policies (só service role).

export const GET = withAuth(async () => {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: "Erro ao carregar leads" }, { status: 500 });
  }
  return NextResponse.json(data || []);
}, ["superadmin"]);

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const rl = checkRateLimit(`leads:${auth.userId}`, { maxAttempts: 30, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde um instante." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const name = sanitizeString(body.name || "", 150);
    if (name.length < 2) {
      return NextResponse.json({ error: "Nome do contato é obrigatório." }, { status: 400 });
    }

    const stage = isValidLeadStage(body.stage) ? body.stage : "novo";
    const source = isValidLeadSource(body.source) ? body.source : "manual";

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        name,
        company: body.company ? sanitizeString(body.company, 150) : null,
        city: body.city ? sanitizeString(body.city, 100) : null,
        uf: body.uf ? sanitizeString(body.uf, 2).toUpperCase() : null,
        phone: body.phone ? sanitizeString(body.phone, 25) : null,
        email: body.email ? sanitizeString(body.email, 150) : null,
        source,
        stage,
        estimated_monthly: Number(body.estimated_monthly) > 0 ? Number(body.estimated_monthly) : 0,
        next_follow_up: /^\d{4}-\d{2}-\d{2}$/.test(String(body.next_follow_up || ""))
          ? body.next_follow_up
          : null,
        notes: body.notes ? sanitizeString(body.notes, 2000) : null,
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  },
  ["superadmin"],
);

export const PATCH = withAuth(
  async (req: NextRequest, { auth }) => {
    const rl = checkRateLimit(`leads:${auth.userId}`, { maxAttempts: 60, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde um instante." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body.id || !isValidUUID(body.id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.stage !== undefined) {
      if (!isValidLeadStage(body.stage)) {
        return NextResponse.json({ error: "Estágio inválido" }, { status: 400 });
      }
      patch.stage = body.stage;
    }
    if (body.next_follow_up !== undefined) {
      patch.next_follow_up = /^\d{4}-\d{2}-\d{2}$/.test(String(body.next_follow_up || ""))
        ? body.next_follow_up
        : null;
    }
    if (body.notes !== undefined) patch.notes = sanitizeString(String(body.notes || ""), 2000);
    if (body.lost_reason !== undefined) {
      patch.lost_reason = sanitizeString(String(body.lost_reason || ""), 500);
    }
    if (body.estimated_monthly !== undefined) {
      const v = Number(body.estimated_monthly);
      patch.estimated_monthly = Number.isFinite(v) && v > 0 ? v : 0;
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
    }
    return NextResponse.json(data);
  },
  ["superadmin"],
);

export const DELETE = withAuth(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("leads").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Erro ao excluir lead" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  },
  ["superadmin"],
);
