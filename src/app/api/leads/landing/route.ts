import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rate-limiter";
import { sanitizeString, isValidEmail } from "@/lib/validation";
import { isValidPhoneDigits } from "@/lib/crm";

// ENDPOINT PÚBLICO: captação de leads pela landing page (sem auth).
// Proteções: rate limit por IP (5 a cada 5 min) + honeypot ("website"
// deve vir vazio — bot preenchem campos invisíveis).

export const POST = async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(`lead-landing:${ip}`, { maxAttempts: 5, windowMs: 300000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));

  // Honeypot: se o campo invisível veio preenchido, é bot — finge sucesso.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = sanitizeString(body.name || "", 150);
  const phone = sanitizeString(body.phone || "", 25);
  if (name.length < 2 || !isValidPhoneDigits(phone)) {
    return NextResponse.json(
      { error: "Preencha nome e telefone válidos (com DDD)." },
      { status: 400 },
    );
  }
  const email = body.email ? sanitizeString(body.email, 150) : null;
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("leads").insert({
    name,
    company: body.company ? sanitizeString(body.company, 150) : null,
    city: body.city ? sanitizeString(body.city, 100) : null,
    phone,
    email,
    source: "landing",
    stage: "novo",
    notes: "Lead capturado automaticamente pela landing page.",
  });
  if (error) {
    return NextResponse.json({ error: "Não foi possível registrar agora." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
};
