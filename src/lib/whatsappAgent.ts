import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ============================================================
// AGENTE DE TRIAGEM WHATSAPP - Evolution API (self-hosted, gratis)
// Maquina de estado por telefone de origem + número de destino (tenant)
// ============================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const WHATSAPP_WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || '';

export interface TriageData {
  deceasedName?: string;
  location?: string;
  familyContact?: string;
  callerPhone?: string;
  tenantId?: string;
}

const STEPS: Record<string, { q: string; next: string }> = {
  init: { q: 'EternityOS Plantão 24h. Para agilizar o atendimento, informe o *nome da pessoa falecida*:', next: 'location' },
  location: { q: 'Obrigado. Agora informe o *local* onde o falecido está (endereço ou hospital):', next: 'family' },
  family: { q: 'Quase pronto! Informe o *telefone de contato da família* (com DDD):', next: 'done' },
};

export function validateWebhookToken(token: string | null): boolean {
  if (!WHATSAPP_WEBHOOK_TOKEN) return false;
  return token === WHATSAPP_WEBHOOK_TOKEN;
}

/**
 * Envia mensagem de texto via Evolution API
 */
export async function sendWhatsApp(
  instance: string,
  to: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: to,
        textMessage: { text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resolve o tenant a partir do número de WhatsApp de DESTINO (que recebeu a msg).
 */
export async function findTenantByWhatsAppNumber(toNumber: string): Promise<{ tenantId: string; instance: string } | null> {
  const clean = toNumber.replace(/\D/g, '');
  const { data, error } = await supabaseAdmin
    .from('tenant_whatsapp_numbers')
    .select('tenant_id, evolution_instance')
    .eq('whatsapp_number', clean)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  return { tenantId: data.tenant_id, instance: data.evolution_instance };
}

/**
 * Processa uma mensagem recebida: cria/atualiza sessão e devolve a resposta.
 */
export async function processIncomingMessage(
  tenantId: string,
  instance: string,
  from: string,
  text: string
): Promise<{ reply: string; done: boolean }> {
  const cleanFrom = from.replace(/\D/g, '');

  // Busca sessão existente
  let { data: session, error: sErr } = await supabaseAdmin
    .from('whatsapp_agent_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone', cleanFrom)
    .maybeSingle();

  // Nova sessão: inicia fluxo
  if (!session || sErr) {
    const { data: newSession, error: createErr } = await supabaseAdmin
      .from('whatsapp_agent_sessions')
      .insert([{ tenant_id: tenantId, phone: cleanFrom, step: 'init', data: {} }])
      .select()
      .single();
    if (createErr || !newSession) {
      return { reply: 'Ocorreu um erro. Tente novamente em instantes.', done: false };
    }
    session = newSession;
  }

  const step = session.step;
  const data = (session.data || {}) as TriageData;

  // Processa o dado informado conforme o passo atual
  if (step === 'location') data.deceasedName = text;
  if (step === 'family') data.location = text;

  // Fluxo concluido: grava despacho de emergência
  if (step === 'family') {
    data.familyContact = text;
    data.callerPhone = cleanFrom;
    data.tenantId = tenantId;

    const { error: insertErr } = await supabaseAdmin.from('emergency_dispatches').insert([
      {
        tenant_id: tenantId,
        deceased_name: data.deceasedName || 'Não informado',
        location: data.location || '',
        family_contact: data.familyContact || '',
        caller_phone: cleanFrom,
        status: 'Aguardando veículo',
        source: 'whatsapp',
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertErr) {
      return { reply: 'Erro ao registrar o chamado. Fale com um atendente.', done: false };
    }

    await supabaseAdmin
      .from('whatsapp_agent_sessions')
      .update({ step: 'done', data, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    return {
      reply:
        '*Chamado registrado com sucesso!*\n\n' +
        `*Falecido:* ${data.deceasedName}\n` +
        `*Local:* ${data.location}\n` +
        `*Contato da família:* ${data.familyContact}\n\n` +
        'Uma equipe entrará em contato em instantes.',
      done: true,
    };
  }

  // Passo seguinte
  const nextStep = STEPS[step]?.next || 'init';
  await supabaseAdmin
    .from('whatsapp_agent_sessions')
    .update({ step: nextStep, data, updated_at: new Date().toISOString() })
    .eq('id', session.id);

  return { reply: STEPS[nextStep]?.q || '', done: false };
}