import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeString, isValidUUID } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

// ============================================================
// CRM INTERNO DEL OPERADOR — HISTÓRICO DE INTERACCIONES por lead.
// La tabla lead_notes es un registro estructurado de llamadas,
// WhatsApp, e-mails, respuestas, etc. (no mezclar en campo notes).
// Restringido a superadmin; RLS sin policies (solo service role).
// ============================================================

export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("lead_id");
    if (!leadId || !isValidUUID(leadId)) {
      return NextResponse.json({ error: "lead_id inválido" }, { status: 400 });
    }

    // Verifica que el lead exista (no exponer nada si no)
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr) {
      return NextResponse.json({ error: "Erro ao consultar lead" }, { status: 500 });
    }
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("lead_notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      return NextResponse.json({ error: "Erro ao carregar histórico" }, { status: 500 });
    }
    return NextResponse.json(data || []);
  },
  ["superadmin"],
);

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const rl = checkRateLimit(`leadnotes:${auth.userId}`, { maxAttempts: 60, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde um instante." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body.lead_id || !isValidUUID(body.lead_id)) {
      return NextResponse.json({ error: "lead_id inválido" }, { status: 400 });
    }
    const note = sanitizeString(body.note || "", 2000);
    if (note.length < 2) {
      return NextResponse.json({ error: "Anotaçáo é curta (mínimo 2 caracteres)." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("lead_notes")
      .insert({
        lead_id: body.lead_id,
        note,
        created_by: auth.userId,
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Erro ao guardar anotaçon" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
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
    const { error } = await supabaseAdmin.from("lead_notes").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Erro ao eliminar anotaçon" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  },
  ["superadmin"],
);