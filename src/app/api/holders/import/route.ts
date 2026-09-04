import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeString, sanitizeCPF, isValidEmail } from '@/lib/validation';
import { getPlanByCode, checkHolderLimit } from '@/lib/planLimits';

// Importação de associados via CSV colado no painel.
// Formato por linha: Nome;CPF;Telefone;Email;Endereco  (delimitador ; ou ,)
// Segurança: autenticado + restrito ao tenant + respeita limite do plano comercial.
const MAX_LINES = 1000;
const CHUNK_SIZE = 200;

interface ParsedRow {
  line: number;
  full_name: string;
  cpf: string;
  phone: string;
  email: string | null;
  address: string | null;
}

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      // SECURITY: rate limit por usuário (importação e operação pesada)
      const rl = checkRateLimit(`import:${auth.userId}`, { maxAttempts: 5, windowMs: 60000 });
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Muitas importações seguidas. Aguarde um minuto.' },
          { status: 429 },
        );
      }

      const body = await req.json();
      const rawCsv = typeof body.csv === "string" ? body.csv : "";
      if (!rawCsv.trim()) {
        return NextResponse.json(
          { error: "Conteudo CSV vazio." },
          { status: 400 },
        );
      }

      const lines = rawCsv
        .split(/\r?\n/)
        .filter((l: string) => l.trim().length > 0);
      if (lines.length > MAX_LINES) {
        return NextResponse.json(
          { error: "Limite de 1000 linhas por importação." },
          { status: 400 },
        );
      }

      const invalid: { line: number; reason: string }[] = [];
      const parsed: ParsedRow[] = [];
      const batchCpfs = new Set<string>();

      lines.forEach((line: string, idx: number) => {
        const lineNo = idx + 1;
        const tabCount = (line.match(/\t/g) || []).length;
        const semiCount = (line.match(/;/g) || []).length;
        const commaCount = (line.match(/,/g) || []).length;
        const delim =
          tabCount >= semiCount && tabCount >= commaCount
            ? "\t"
            : semiCount >= commaCount
              ? ";"
              : ",";
        const cols = line.split(delim).map((c: string) => c.trim());

        // Pula cabecalho (ex: Nome;CPF;Telefone;Email;Endereco)
        if (
          lineNo === 1 &&
          /nome/i.test(cols[0] || "") &&
          /cpf/i.test(cols[1] || "")
        )
          return;

        const [rawName, rawCpf, rawPhone, rawEmail, rawAddress] = cols;
        const full_name = sanitizeString(rawName || "", 255);
        const cpf = sanitizeCPF(rawCpf || "");
        const phone = sanitizeString(rawPhone || "", 20);
        const email = rawEmail ? sanitizeString(rawEmail, 254) : null;
        const address = rawAddress ? sanitizeString(rawAddress, 500) : null;

        if (!full_name || full_name.length < 2) {
          invalid.push({ line: lineNo, reason: "Nome inválido ou ausente" });
          return;
        }
        if (cpf.length !== 11) {
          invalid.push({
            line: lineNo,
            reason: "CPF inválido (precisa ter 11 digitos)",
          });
          return;
        }
        if (!phone || phone.length < 10) {
          invalid.push({ line: lineNo, reason: "Telefone inválido" });
          return;
        }
        if (email && !isValidEmail(email)) {
          invalid.push({ line: lineNo, reason: "E-mail inválido" });
          return;
        }
        if (batchCpfs.has(cpf)) {
          invalid.push({ line: lineNo, reason: "CPF duplicado no arquivo" });
          return;
        }
        batchCpfs.add(cpf);
        parsed.push({ line: lineNo, full_name, cpf, phone, email, address });
      });

      if (parsed.length === 0) {
        return NextResponse.json({
          success: true,
          imported: 0,
          skipped_duplicates: 0,
          invalid,
        });
      }

      // LIMITE DO PLANO COMERCIAL: importa apenas o que couber no plano
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
      const availableSlots = plan.maxHolders - (holdersCount || 0);

      // Duplicados no banco: uma unica consulta para todos os CPFs do lote
      const cpfList = parsed.map((p) => p.cpf);
      const { data: existing } = await supabaseAdmin
        .from("holders")
        .select("cpf")
        .eq("tenant_id", auth.tenantId)
        .in("cpf", cpfList);
      const existingSet = new Set(
        (existing || []).map((e: { cpf: string }) => e.cpf),
      );

      const toInsert = parsed.filter((p) => {
        if (existingSet.has(p.cpf)) {
          invalid.push({ line: p.line, reason: "CPF ja cadastrado" });
          return false;
        }
        return true;
      });

      // Respeita vagas restantes do plano
      const overflow = toInsert.splice(availableSlots);
      overflow.forEach((p) => {
        invalid.push({
          line: p.line,
          reason: "Não importado: limite do plano atingido",
        });
      });

      let imported = 0;
      const insertedIds: string[] = [];

      for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
        const chunk = toInsert.slice(i, i + CHUNK_SIZE).map((p) => ({
          tenant_id: auth.tenantId,
          full_name: p.full_name,
          cpf: p.cpf,
          phone: p.phone,
          email: p.email,
          address: p.address,
        }));

        const { data: inserted, error } = await supabaseAdmin
          .from("holders")
          .insert(chunk)
          .select("id, full_name, cpf, phone, email, address");

        if (error) {
          chunk.forEach((_, cIdx) => {
            invalid.push({
              line: toInsert[i + cIdx].line,
              reason: "Erro no banco: " + error.message,
            });
          });
          continue;
        }
        (inserted || []).forEach((h: { id: string }) => insertedIds.push(h.id));
        imported += inserted?.length || 0;
      }

      // Contrato inicial para cada titular importado (mesma regra do cadastro individual)
      if (insertedIds.length > 0) {
        let planId: string | null = null;
        // Reusa plano existente (ou cria o default sem inventar mensalidade)
        const { data: existingPlan } = await supabaseAdmin
          .from("plans")
          .select("id")
          .eq("tenant_id", auth.tenantId)
          .ilike("name", "Plano Familiar Master")
          .limit(1)
          .maybeSingle();
        planId = existingPlan?.id || null;

        if (!planId) {
          const { data: newP } = await supabaseAdmin
            .from("plans")
            .insert([
              {
                tenant_id: auth.tenantId,
                name: "Plano Familiar Master",
                monthly_fee: 0,
                max_dependents: 6,
              },
            ])
            .select("id")
            .single();
          planId = newP?.id || null;
        }

        if (planId) {
          const today = new Date().toISOString().split("T")[0];
          const contracts = insertedIds.map((holderId) => ({
            tenant_id: auth.tenantId,
            holder_id: holderId,
            plan_id: planId,
            status: "active",
            start_date: today,
          }));
          for (let i = 0; i < contracts.length; i += CHUNK_SIZE) {
            await supabaseAdmin
              .from("contracts")
              .insert(contracts.slice(i, i + CHUNK_SIZE));
          }
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        skipped_duplicates: existingSet.size,
        invalid,
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }
  },
  ["superadmin", "admin", "manager", "attendant"],
);
