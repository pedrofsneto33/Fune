/**
 * Formata telefone brasileiro para o padrão internacional (55DDD9XXXXXXXX)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

export interface WhatsAppChargePayload {
  holderName: string;
  phone: string;
  amount: number;
  dueDate: string;
  pixCode?: string;
  cpf: string;
  baseUrl?: string;
}

/**
 * Gera link wa.me com mensagem de cobrança pronta (PIX + Link da Carteirinha)
 */
export function generateChargeWhatsAppUrl(payload: WhatsAppChargePayload): string {
  const targetPhone = formatPhoneForWhatsApp(payload.phone);
  const formattedAmount = payload.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const rawCpf = payload.cpf.replace(/\D/g, '');
  const domain = payload.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const carteirinhaUrl = `${domain}/carteirinha/${rawCpf}`;

  let message = `Olá, *${payload.holderName}*!\n\n`;
  message += `Segue a cobrança da sua mensalidade do plano funerário:\n`;
  message += `*Valor:* ${formattedAmount}\n`;
  message += `*Vencimento:* ${payload.dueDate}\n\n`;

  if (payload.pixCode) {
    message += `*Código PIX Copia e Cola:*\n` + payload.pixCode + `\n\n`;
  }

  message += `Acesse sua carteirinha e status do plano em:\n${carteirinhaUrl}\n\n`;
  message += `Qualquer dúvida, estamos à disposição!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
