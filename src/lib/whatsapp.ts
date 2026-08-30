export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

export interface WhatsAppChargePayload {
  holderName?: string;
  customerName?: string;
  phone?: string;
  amount?: any;
  dueDate?: string;
  pixCode?: string;
  planName?: string;
  cpf?: string;
  baseUrl?: string;
  text?: string;
}

export function formatWhatsAppMessage(input: string | WhatsAppChargePayload, phoneArg?: string): string {
  if (typeof input === 'object' && input !== null) {
    const phone = formatPhoneForWhatsApp(input.phone || phoneArg || '');
    const name = input.customerName || input.holderName || 'Associado';
    const plan = input.planName ? `do plano *${input.planName}*` : 'do plano funerário';
    const val = typeof input.amount === 'number'
      ? input.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : input.amount || '';
    let msg = `Olá, *${name}*!\n\nSegue a cobrança da sua mensalidade ${plan}:\n*Valor:* ${val}\n*Vencimento:* ${input.dueDate || ''}\n\n`;
    if (input.pixCode) {
      msg += `*Código PIX Copia e Cola:*\n` + input.pixCode + `\n\n`;
    }
    msg += `Qualquer dúvida, estamos à disposição!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  const phone = phoneArg ? formatPhoneForWhatsApp(phoneArg) : '';
  const encoded = encodeURIComponent(String(input || ''));
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function generateChargeWhatsAppUrl(payload: WhatsAppChargePayload): string {
  return formatWhatsAppMessage(payload);
}
