import { NextRequest, NextResponse } from 'next/server';
import {
  validateWebhookToken,
  findTenantByWhatsAppNumber,
  processIncomingMessage,
  sendWhatsApp,
} from '@/lib/whatsappAgent';

// ============================================================
// Webhook do Agente de Triagem WhatsApp (Evolution API)
// Recebe mensagens recebidas e responde automaticamente.
// ============================================================

export async function POST(req: NextRequest) {
  // 1) Validar token (configurado como EVOLUTION_SERVER_WEBHOOK_SECRET na instancia)
  const token = req.headers.get('x-webhook-token') || (req.headers.get('webhook-token') as string);
  if (!validateWebhookToken(token)) {
    return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 });
  }

  // 2) Extrair dados da mensagem (formato Evolution API v2)
  const data = body?.data || body;
  const from = data?.key?.remoteJid || '';
  const to = data?.key?.participant || '';
  const text =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.message?.imageMessage?.caption ||
    '';

  // Apenas mensagens de texto de numeros externos
  if (!from || !text || !from.includes('@s.whatsapp.net') || to) {
    return NextResponse.json({ ok: true }); // ignora silenciosamente
  }

  const fromNumber = from.split('@')[0] || '';

  // 3) Resolver tenant pelo numero de DESTINO (remetente da instancia)
  //    Na Evolution, o numero do bot da instancia esta na mensagem quando e group/lida;
  //    para 1:1, usamos o numero da instancia cadastrado no tenant_whatsapp_numbers.
  //    Como o webhook nao traz o numero destino em mensagens 1:1, buscamos a instancia
  //    pelo token (se configurado multiplas instancias, cada uma aponta para a propria rota).
  const { data: numberRows, error: numErr } = await (
    await import('@/lib/supabaseAdmin')
  ).supabaseAdmin
    .from('tenant_whatsapp_numbers')
    .select('tenant_id, evolution_instance')
    .eq('active', true);

  if (numErr || !numberRows || numberRows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // 4) Processar: usa a primeira instancia ativa como tenant destino (MVP).
  //    Para multi-instancia por tenant, o token deve identificar a instancia.
  const target = numberRows[0];
  const result = await processIncomingMessage(
    target.tenant_id,
    target.evolution_instance,
    fromNumber,
    text
  );

  // 5) Enviar resposta
  await sendWhatsApp(target.evolution_instance, fromNumber, result.reply);

  return NextResponse.json({ ok: true });
}