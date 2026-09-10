import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeString, isValidUUID } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limiter";

// ============================================================
// DEPENDENTES VIA API SERVER (hardening)
// Todas as operações passam por supabaseAdmin (service role) com
// isolamento por tenant explícito. Nada de escrita via cliente
// browser (RLS não pode garantir isolamento em client).
// GET      → listar dependentes de um titular
// POST     → adicionar dependente (valida tenant + limite do plano)
// PATCH    → editar dependente (valida tenant)
// DELETE   → excluir dependente (valida tenant)
// ============================================================

const VALID_RELATIONS = ["Cônjuge", "Filho(a)", "Pai/Mãe", "Outro"];

// GET /api/dependents?holder_id=xxx
export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const url = new URL(req.url);
      const holderId = url.searchParams.get("holder_id");
      if (!holderId || !isValidUUID(holderId)) {
        return NextResponse.json({ error: "holder_id inválido" }, { status: 400 });
      }
      const { data: holder, error: holderErr } = await supabaseAdmin
        .from("holders")
        .select("id")
        .eq("id", holderId)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();
      if (holderErr) {
        return NextResponse.json({ error: "Erro ao verificar titular" }, { status: 500 });
      }
      if (!holder) {
        return NextResponse.json({ error: "Titular não encontrado" }, { status: 404 });
      }
      const { data, error } = await supabaseAdmin
        .from("dependents")
        .select("*")
        .eq("holder_id", holderId)
        .eq("tenant_id", auth.tenantId)
        .order("created_at", { ascending: true });
      if (error) {
        return NextResponse.json({ error: "Erro ao buscar dependentes" }, { status: 500 });
      }
      return NextResponse.json({ dependents: data || [] });
    } catch {
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  },
  ["superadmin", "admin", "manager", "attendant"],
);

// POST /api/dependents
export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const rl = checkRateLimit(`dependents:${auth.userId}`, { maxAttempts: 30, windowMs: 60000 });
      if (!rl.allowed) {
        return NextResponse.json({ error: "Muitas requisições. Aguarde um instante." }, { status: 429 });
      }
      const body = await req.json().catch(() => ({}));
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
      const { data: holder, error: holderErr } = await supabaseAdmin
        .from("holders")
        .select("id")
        .eq("id", holder_id)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();
      if (holderErr) {
        return NextResponse.json({ error: "Erro ao verificar titular" }, { status: 500 });
      }
      if (!holder) {
        return NextResponse.json({ error: "Titular não encontrado" }, { status: 404 });
      }
      // Verifica limite de dependentes do plano ativo
      const { data: contract } = await supabaseAdmin
        .from("contracts")
        .select("plans(max_dependents)")
        .eq("holder_id", holder_id)
        .eq("status", "active")
        .maybeSingle();
      const maxDeps = (contract?.plans as { max_dependents?: number }[] | undefined)?.[0]?.max_dependents ?? 4;
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from("dependents")
        .select("id")
        .eq("holder_id", holder_id)
        .eq("tenant_id", auth.tenantId);
      if (existingErr) {
        return NextResponse.json({ error: "Erro ao verificar limite" }, { status: 500 });
      }
      if (existing && existing.length >= maxDeps) {
        return NextResponse.json({ error: `Limite de ${maxDeps} dependentes atingido` }, { status: 400 });
      }
      const insertData: Record<string, unknown> = {
        tenant_id: auth.tenantId,
        holder_id,
        full_name: name,
        relation,
      };
      if (cpf) insertData.cpf = sanitizeString(String(cpf), 14);
      if (birth_date) insertData.birth_date = birth_date;
      const { data, error } = await supabaseAdmin
        .from("dependents")
        .insert([insertData])
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: "Erro ao criar dependente" }, { status: 500 });
      }
      return NextResponse.json({ dependent: data }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  },
  ["superadmin", "admin", "manager", "attendant"],
);

// PATCH /api/dependents
export const PATCH = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { id, full_name, relation, cpf, birth_date } = body;
      if (!id || !isValidUUID(id)) {
        return NextResponse.json({ error: "id inválido" }, { status: 400 });
      }
      const { data: dep, error: depErr } = await supabaseAdmin
        .from("dependents")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();
      if (depErr) {
        return NextResponse.json({ error: "Erro ao verificar dependente" }, { status: 500 });
      }
      if (!dep) {
        return NextResponse.json({ error: "Dependente não encontrado" }, { status: 404 });
      }
      const patch: Record<string, unknown> = {};
      if (full_name !== undefined) {
        const name = sanitizeString(String(full_name), 255);
        if (name.length < 3) {
          return NextResponse.json({ error: "Nome muito curto" }, { status: 400 });
        }
        patch.full_name = name;
      }
      if (relation !== undefined) {
        if (!VALID_RELATIONS.includes(relation)) {
          return NextResponse.json({ error: "Parentesco inválido" }, { status: 400 });
        }
        patch.relation = relation;
      }
      if (cpf !== undefined) patch.cpf = cpf ? sanitizeString(String(cpf), 14) : null;
      if (birth_date !== undefined) patch.birth_date = birth_date;
      const { data, error } = await supabaseAdmin
        .from("dependents")
        .update(patch)
        .eq("id", id)
        .eq("tenant_id", auth.tenantId)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: "Erro ao atualizar dependente" }, { status: 500 });
      }
      return NextResponse.json({ dependent: data });
    } catch {
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  },
  ["superadmin", "admin", "manager", "attendant"],
);

// DELETE /api/dependents?id=xxx
export const DELETE = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id || !isValidUUID(id)) {
        return NextResponse.json({ error: "id inválido" }, { status: 400 });
      }
      const { data: dep, error: depErr } = await supabaseAdmin
        .from("dependents")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();
      if (depErr) {
        return NextResponse.json({ error: "Erro ao verificar dependente" }, { status: 500 });
      }
      if (!dep) {
        return NextResponse.json({ error: "Dependente não encontrado" }, { status: 404 });
      }
      const { error } = await supabaseAdmin
        .from("dependents")
        .delete()
        .eq("id", id)
        .eq("tenant_id", auth.tenantId);
      if (error) {
        return NextResponse.json({ error: "Erro ao excluir dependente" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  },
  ["superadmin", "admin", "manager"],
);
