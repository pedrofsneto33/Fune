import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  sanitizeString,
  sanitizeCPF,
  isValidEmail,
  clampNumber,
  isValidUUID,
} from "@/lib/validation";
import { getPlanByCode, checkHolderLimit } from "@/lib/planLimits";

export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      // Paginação (F-28): default 1000 (cobre todos os planos até o plano
      // Enterprise, que é o único sem limite); opcional via ?limit=&page=.
      const url = new URL(req.url);
      const limitParam = Number(url.searchParams.get("limit"));
      const pageParam = Number(url.searchParams.get("page"));
      const limit =
        Number.isFinite(limitParam) && limitParam > 0
          ? Math.min(Math.floor(limitParam), 5000)
          : 1000;
      const page =
        Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 0;
      const from = page * limit;
      const to = from + limit - 1;

      // SECURITY: restricao de campos por role (defesa em profundidade).
      // Superadmin/admin/financial recebem dados completos (incl. CPF,
      // endereco, email e dados financeiros); manager/attendant recebem apenas
      // a visao operacional, sem campos sensiveis.
      const isPrivilegedRole = ["superadmin", "admin", "financial"].includes(
        auth.role,
      );

      // SECURITY: restringe colunas ja na query (defesa em profundidade) —
      // roles nao-privilegiadas nao buscam do banco campos sensiveis (CPF,
      // endereco, email, dados financeiros). Branches com literais mantem a
      // inferencia de tipos do client Supabase funcionando.
      const countQuery = supabaseAdmin
        .from("holders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", auth.tenantId);

      const holdersQuery = isPrivilegedRole
        ? supabaseAdmin
            .from("holders")
            .select("*")
            .eq("tenant_id", auth.tenantId)
            .order("created_at", { ascending: false })
            .range(from, to)
        : supabaseAdmin
            .from("holders")
            .select("id, full_name, phone, status, created_at")
            .eq("tenant_id", auth.tenantId)
            .order("created_at", { ascending: false })
            .range(from, to);

      const [{ data: holdersList, error }, { count: totalCount }] =
        await Promise.all([holdersQuery, countQuery]);

      if (error) {
        return NextResponse.json(
          { error: "Erro ao buscar titulares" },
          { status: 500 },
        );
      }

      if (!holdersList || holdersList.length === 0) {
        return NextResponse.json([], {
          headers: { "X-Total-Count": String(totalCount ?? 0) },
        });
      }

      // F-15: busca em lote (2 queries no total) em vez de 2 queries por
      // titular (N+1). Com plano profissional (1000 titulares) seriam 2001
      // queries no esquema antigo; aqui sao sempre 2 + remontagem em memoria.
      const holderIds = holdersList.map((h: any) => h.id);

      const [{ data: allDeps }, { data: allContracts }] = await Promise.all([
        supabaseAdmin
          .from("dependents")
          .select("id, holder_id, full_name, cpf, relation")
          .eq("tenant_id", auth.tenantId)
          .in("holder_id", holderIds),
        supabaseAdmin
          .from("contracts")
          .select("id, holder_id, status, start_date, plan_id, plans(name, monthly_fee)")
          .eq("tenant_id", auth.tenantId)
          .in("holder_id", holderIds),
      ]);

      const depsByHolder = new Map<string, any[]>();
      for (const d of allDeps || []) {
        const list = depsByHolder.get(d.holder_id) ?? [];
        list.push(
          isPrivilegedRole
            ? d
            : { id: d.id, full_name: d.full_name, relation: d.relation },
        );
        depsByHolder.set(d.holder_id, list);
      }

      const contractsByHolder = new Map<string, any[]>();
      for (const c of allContracts || []) {
        const list = contractsByHolder.get(c.holder_id) ?? [];
        const plan = (c as any).plans;
        list.push(
          isPrivilegedRole
            ? c
            : { ...c, plans: plan ? { name: plan.name } : null },
        );
        contractsByHolder.set(c.holder_id, list);
      }

      const result = holdersList.map((h: any) => {
        const dependents = depsByHolder.get(h.id) ?? [];
        const contracts = contractsByHolder.get(h.id) ?? [];
        if (isPrivilegedRole) {
          return { ...h, dependents, contracts };
        }
        // visao operacional minima: remove CPF/endereco/email/mensalidade
        const { cpf, email, address, ...rest } = h as any;
        return { ...rest, dependents, contracts };
      });

      return NextResponse.json(result, {
        headers: { "X-Total-Count": String(totalCount ?? 0) },
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: "Erro interno ao processar requisição" },
        { status: 500 },
      );
    }
  },
  ["superadmin", "admin", "manager", "attendant", "financial"],
);

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const body = await req.json();

      // SECURITY: Sanitize and validate inputs
      const full_name = sanitizeString(body.full_name, 255);
      const cpf = sanitizeCPF(body.cpf || "");
      const phone = sanitizeString(body.phone, 20);
      const email = body.email ? sanitizeString(body.email, 254) : null;
      const address = body.address ? sanitizeString(body.address, 500) : null;
      // SECURITY: plan_id obrigatorio (fonte unica de verdade em public.plans).
      // Removida a auto-criacao de plano por .ilike(name) — ela gerava duplicatas
      // ("Familiar Ouro" vs "familiar ouro" etc) toda vez que o atendente digitava
      // o nome de um jeito diferente. Criacao de plano deve acontecer via
      // /api/plans (POST) explicitamente.
      const planIdRaw = body.plan_id;
      if (!planIdRaw || typeof planIdRaw !== "string" || !isValidUUID(planIdRaw)) {
        return NextResponse.json(
          { error: "Selecione um plano funerario do catalogo antes de cadastrar o titular." },
          { status: 400 },
        );
      }

      // Validation
      if (!full_name || full_name.length < 2) {
        return NextResponse.json(
          { error: "Nome completo é obrigatório (mínimo 2 caracteres)." },
          { status: 400 },
        );
      }

      if (!cpf || cpf.length !== 11) {
        return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
      }

      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { error: "Telefone inválido." },
          { status: 400 },
        );
      }

      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { error: "E-mail inválido." },
          { status: 400 },
        );
      }

      // VERIFICAÇÃO DE LIMITE DO PLANO COMERCIAL
      const { data: tenantRow } = await supabaseAdmin
        .from("tenants")
        .select("commercial_plan")
        .eq("id", auth.tenantId)
        .single();
      const plan = getPlanByCode(tenantRow?.commercial_plan);

      const { count: holdersCount } = await supabaseAdmin
        .from("holders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", auth.tenantId);
      const limitCheck = checkHolderLimit(plan, holdersCount || 0);

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.message,
            code: "PLAN_LIMIT_EXCEEDED",
            plan: plan.code,
          },
          { status: 402 },
        );
      }

            const city = body.city ? sanitizeString(body.city, 100) : null;
      const state = body.state ? sanitizeString(body.state, 2).toUpperCase() : null;
      const birth_date = body.birth_date ? body.birth_date : null;
      const gender = body.gender ? sanitizeString(body.gender, 20) : null;
      const observations = body.observations
        ? sanitizeString(body.observations, 1000)
        : null;
      // Vendedor responsavel pela venda (comissao) - texto livre sanitizado
      const seller_name = body.seller_name
        ? sanitizeString(body.seller_name, 150)
        : null;

      const baseInsert = {
        tenant_id: auth.tenantId,
        full_name: full_name.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
      };

      // Campos enriquecidos (cidade, uf, nascimento, genero, obs) — direcionamento preciso via API.
      // Retry defensivo: se a migração ainda não foi rodada e a coluna não existir,
      // refaz o insert sem os campos extras para NUNCA quebrar o cadastro de titular.
      let insertResult = await supabaseAdmin
        .from("holders")
        .insert([
          { ...baseInsert, city, state, birth_date, gender, observations },
        ])
        .select()
        .single();

      let { data: holder, error: holderError } = insertResult;

      if (holderError) {
        const msg = String(holderError.message || "");
        if (
          msg.toLowerCase().includes("does not exist") ||
          msg.toLowerCase().includes("column")
        ) {
          const fb = await supabaseAdmin
            .from("holders")
            .insert([baseInsert])
            .select()
            .single();
          holder = fb.data;
          holderError = fb.error;
        }
      }


      if (holderError)
        return NextResponse.json(
          { error: holderError.message },
          { status: 500 },
        );

      // SECURITY: valida que o plan_id existe E pertence a este tenant
      // (mesmo padrao de checagem de ownership usado em /api/contracts para holder_id/plan_id).
      const { data: planRow, error: planErr } = await supabaseAdmin
        .from("plans")
        .select("id, max_dependents")
        .eq("id", planIdRaw)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();
      if (planErr) {
        return NextResponse.json(
          { error: "Erro ao validar plano selecionado." },
          { status: 500 },
        );
      }
      if (!planRow) {
        return NextResponse.json(
          { error: "Plano funerario invalido ou nao pertence a este tenant." },
          { status: 404 },
        );
      }

      if (holder) {
        await supabaseAdmin.from("contracts").insert([
          {
            tenant_id: auth.tenantId,
            holder_id: holder.id,
            plan_id: planRow.id,
            status: "active",
            start_date: new Date().toISOString().split("T")[0],
            seller_name,
          },
        ]);
      }

      return NextResponse.json({ success: true, holder }, { status: 201 });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }
  },
  ["superadmin", "admin", "manager", "attendant"],
);

// SECURITY: Edição de titular - CPF imutável (e a chave de identificação/busca), restrito ao tenant
export const PATCH = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const body = await req.json();
      const id = body.id;

      if (
        !id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        return NextResponse.json(
          { error: "ID do titular inválido ou ausente." },
          { status: 400 },
        );
      }

      const updateData: Record<string, unknown> = {};

      if (body.status !== undefined) {
        if (!["ativo", "inativo"].includes(body.status)) {
          return NextResponse.json(
            { error: "Status inválido (use ativo ou inativo)." },
            { status: 400 },
          );
        }
        updateData.status = body.status;
      }

      if (body.full_name !== undefined) {
        const full_name = sanitizeString(body.full_name, 255);
        if (!full_name || full_name.length < 2) {
          return NextResponse.json(
            { error: "Nome completo inválido (mínimo 2 caracteres)." },
            { status: 400 },
          );
        }
        updateData.full_name = full_name;
      }

      if (body.phone !== undefined) {
        const phone = sanitizeString(body.phone, 20);
        if (!phone || phone.length < 10) {
          return NextResponse.json(
            { error: "Telefone inválido." },
            { status: 400 },
          );
        }
        updateData.phone = phone;
      }

      if (body.email !== undefined) {
        const email = body.email ? sanitizeString(body.email, 254) : null;
        if (email && !isValidEmail(email)) {
          return NextResponse.json(
            { error: "E-mail inválido." },
            { status: 400 },
          );
        }
        updateData.email = email;
      }

      if (body.address !== undefined) {
        updateData.address = body.address
          ? sanitizeString(body.address, 500)
          : null;
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "Nenhum campo válido para atualizar." },
          { status: 400 },
        );
      }

      const { data: holder, error } = await supabaseAdmin
        .from("holders")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", auth.tenantId)
        .select()
        .maybeSingle();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      if (!holder)
        return NextResponse.json(
          { error: "Titular não encontrado." },
          { status: 404 },
        );

      // Sincronizar seller_name no contrato ativo (comission por vendedor)
      if (body.seller_name !== undefined) {
        const seller = body.seller_name
          ? sanitizeString(body.seller_name, 150)
          : null;
        await supabaseAdmin
          .from("contracts")
          .update({ seller_name: seller })
          .eq("holder_id", id)
          .eq("tenant_id", auth.tenantId)
          .eq("status", "active");
      }

      return NextResponse.json({ success: true, holder });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }
  },
  ["superadmin", "admin", "manager", "attendant"],
);

// F-11: exclusao fisica removida. Em ERP de servicos funerarios, excluir um
// titular apaga contratos, pagamentos e comissoes (CASCADE) — destruindo
// historico financeiro e contabil. A operacao correta e INATIVAR (soft delete),
// que ja e feita via PATCH /api/holders { id, status: 'inativo' } (pela UI).
// Mantemos este endpoint, mas como inativacao com cascata de status, para
// compatibilidade com eventuais consumidores antigos que chamavam DELETE.
export const DELETE = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (
        !id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        return NextResponse.json(
          { error: "ID do titular inválido ou ausente." },
          { status: 400 },
        );
      }

      // Garante que o titular pertence ao tenant do usuário autenticado
      const { data: holder, error: findError } = await supabaseAdmin
        .from("holders")
        .select("id, full_name, status")
        .eq("id", id)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();

      if (findError)
        return NextResponse.json(
          { error: "Erro ao localizar titular." },
          { status: 500 },
        );
      if (!holder)
        return NextResponse.json(
          { error: "Titular não encontrado." },
          { status: 404 },
        );
      if ((holder as any).status === "inativo") {
        return NextResponse.json(
          { error: "Titular já está inativo." },
          { status: 409 },
        );
      }

      // Soft delete: inativa titular — preserva contratos/pagamentos/comissoes
      const { error: updErr } = await supabaseAdmin
        .from("holders")
        .update({ status: "inativo" })
        .eq("id", id)
        .eq("tenant_id", auth.tenantId);
      if (updErr)
        return NextResponse.json(
          { error: "Erro ao inativar titular: " + updErr.message },
          { status: 500 },
        );

      return NextResponse.json({
        success: true,
        message:
          "Associado " + (holder as any).full_name + " inativado com sucesso.",
      });
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  },
  ["superadmin", "admin"],
);
