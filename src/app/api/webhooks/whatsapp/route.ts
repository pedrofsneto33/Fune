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
  // 1) Validar token (configurado como EVOLUTION_SERVER_WEBHOOK_SECRET na instância)
  const token = req.headers.get('x-webhook-token') || (req.headers.get('webhook-token') as string);
  if (!validateWebhookToken(token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
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

  // Apenas mensagens de texto de números externos
  if (!from || !text || !from.includes('@s.whatsapp.net') || to) {
    return NextResponse.json({ ok: true }); // ignora silenciosamente
  }

  const fromNumber = from.split('@')[0] || '';

  // 3) Resolver tenant pelo número de DESTINO (remetente da instância)
  //    Na Evolution, o número do bot da instância esta na mensagem quando e group/lida;
  //    para 1:1, usamos o número da instância cadastrado no tenant_whatsapp_numbers.
  //    Como o webhook não traz o número destino em mensagens 1:1, buscamos a instância
  //    pelo token (se configurado multiplas instâncias, cada uma aponta para a propria rota).
  const { data: numberRows, error: numErr } = await (
    await import('@/lib/supabaseAdmin')
  ).supabaseAdmin
    .from('tenant_whatsapp_numbers')
    .select('tenant_id, evolution_instance')
    .eq('active', true);

  if (numErr || !numberRows || numberRows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // 4) Processar: usa a primeira instância ativa como tenant destino (MVP).
  //    Para multi-instância por tenant, o token deve identificar a instância.
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