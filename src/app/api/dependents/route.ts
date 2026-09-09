import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { sanitizeString, isValidUUID } from "@/lib/validation";

const VALID_RELATIONS = ["Cônjuge", "Filho(a)", "Pai/Mãe", "Outro"];

function getSupabase() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/dependents?holder_id=xxx
export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    const url = new URL(req.url);
    const holderId = url.searchParams.get("holder_id");
    if (!holderId || !isValidUUID(holderId)) {
      return NextResponse.json({ error: "holder_id inválido" }, { status: 400 });
    }
    const supabaseAdmin = getSupabase();
    const { data: holder } = await supabaseAdmin
      .from("holders").select("id").eq("id", holderId).eq("tenant_id", auth.tenantId).single();
    if (!holder) return NextResponse.json({ error: "Titular não encontrado" }, { status: 404 });
    const { data, error } = await supabaseAdmin
      .from("dependents").select("*").eq("holder_id", holderId).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
    return NextResponse.json({ dependents: data || [] });
  },
  ["superadmin", "admin", "manager", "attendant"]
);

// POST /api/dependents
export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await req.json();
    const { holder_id, full_name, relation, cpf, birth_date } = body;
    if (!holder_id || !isValidUUID(holder_id)) {
      return NextResponse.json({ error: "holder_id inválido" }, { status: 400 });
    }
    const name = sanitizeString(String(full_name || ""), 255);
    if (name.length < 3) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 3 caracteres" }, { status: 400 });
    }
    if (!VALID_RELATIONS.includes(relation)) {
      return NextResponse.json({ error: "Parentesco inválido" }, { status: 400 });
    }
    const supabaseAdmin = getSupabase();
    const { data: holder } = await supabaseAdmin
      .from("holders").select("id").eq("id", holder_id).eq("tenant_id", auth.tenantId).single();
    if (!holder) return NextResponse.json({ error: "Titular não encontrado" }, { status: 404 });
    // Verifica limite de dependentes
    const { data: contract } = await supabaseAdmin
      .from("contracts").select("plans(max_dependents)").eq("holder_id", holder_id).eq("status", "active").single();
    const maxDeps = contract?.plans?.max_dependents ?? 4;
    const { data: existing } = await supabaseAdmin
      .from("dependents").select("id").eq("holder_id", holder_id);
    if (existing && existing.length >= maxDeps) {
      return NextResponse.json({ error: `Limite de ${maxDeps} dependentes atingido` }, { status: 400 });
    }
    const insertData: Record<string, unknown> = {
      tenant_id: auth.tenantId, holder_id, full_name: name, relation,
    };
    if (cpf) insertData.cpf = sanitizeString(String(cpf), 14);
    if (birth_date) insertData.birth_date = birth_date;
    const { data, error } = await supabaseAdmin
      .from("dependents").insert([insertData]).select().single();
    if (error) return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
    return NextResponse.json({ dependent: data }, { status: 201 });
  },
  ["superadmin", "admin", "manager", "attendant"]
);

// PATCH /api/dependents
export const PATCH = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await req.json();
    const { id, full_name, relation, cpf, birth_date } = body;
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const supabaseAdmin = getSupabase();
    const { data: dep } = await supabaseAdmin
      .from("dependents").select("id").eq("id", id).eq("tenant_id", auth.tenantId).single();
    if (!dep) return NextResponse.json({ error: "Dependente não encontrado" }, { status: 404 });
    const patch: Record<string, unknown> = {};
    if (full_name !== undefined) {
      const name = sanitizeString(String(full_name), 255);
      if (name.length < 3) return NextResponse.json({ error: "Nome muito curto" }, { status: 400 });
      patch.full_name = name;
    }
    if (relation !== undefined) {
      if (!VALID_RELATIONS.includes(relation)) return NextResponse.json({ error: "Parentesco inválido" }, { status: 400 });
      patch.relation = relation;
    }
    if (cpf !== undefined) patch.cpf = cpf ? sanitizeString(String(cpf), 14) : null;
    if (birth_date !== undefined) patch.birth_date = birth_date;
    const { data, error } = await supabaseAdmin
      .from("dependents").update(patch).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    return NextResponse.json({ dependent: data });
  },
  ["superadmin", "admin", "manager", "attendant"]
);

// DELETE /api/dependents?id=xxx
export const DELETE = withAuth(
  async (req: NextRequest, { auth }) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const supabaseAdmin = getSupabase();
    const { data: dep } = await supabaseAdmin
      .from("dependents").select("id").eq("id", id).eq("tenant_id", auth.tenantId).single();
    if (!dep) return NextResponse.json({ error: "Dependente não encontrado" }, { status: 404 });
    const { error } = await supabaseAdmin.from("dependents").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
    return NextResponse.json({ ok: true });
  },
  ["superadmin", "admin", "manager"]
);
