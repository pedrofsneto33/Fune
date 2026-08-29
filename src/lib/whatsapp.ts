export interface WhatsAppMessageParams {
  // Novos campos estruturados
  holderName?: string;
  customerName?: string; // Retrocompatibilidade
  planName?: string;
  phone?: string;
  amount?: string | number;
  dueDate?: string;
  month?: string; // Retrocompatibilidade
  bankSlipUrl?: string;
  link?: string; // Retrocompatibilidade
  identificationField?: string;
  pixCode?: string; // Retrocompatibilidade
  installmentCount?: number;
  tenantName?: string;
}

export function formatWhatsAppMessage(params: WhatsAppMessageParams): string {
  const name = params.holderName || params.customerName || 'Associado(a)';
  const plan = params.planName || 'Plano Funerário';
  const tenant = params.tenantName || 'Eternity SOS';
  const slipUrl = params.bankSlipUrl || params.link;
  const installments = params.installmentCount || 1;

  let message = `Olá, *${name}*! 👋\n\n`;
  message += `Aqui é do atendimento *${tenant}* referente ao seu contrato (*${plan}*).\n\n`;

  if (installments > 1) {
    message += `📄 Segue o seu *Carnê Anual/Parcelado* (${installments} parcelas).\n`;
  } else if (params.amount) {
    message += `📄 Segue a sua mensalidade ${params.month ? `de *${params.month}* ` : ''}no valor de *R$ ${params.amount}*.\n`;
  }

  if (params.dueDate) {
    message += `🗓️ *Vencimento:* ${params.dueDate}\n`;
  }

  if (params.identificationField) {
    message += `\n🔢 *Linha Digitável (Boleto):*\n\`${params.identificationField}\`\n`;
  }

  if (params.pixCode) {
    message += `\n📱 *Código PIX Copia e Cola:*\n\`${params.pixCode}\`\n`;
  }

  if (slipUrl) {
    message += `\n🔗 *Link para Visualizar / Baixar Boleto ou Carnê em PDF:*\n${slipUrl}\n`;
  }

  message += `\nQualquer dúvida, estamos à sua inteira disposição 24h!\n*${tenant}*`;

  return encodeURIComponent(message);
}

export function openWhatsAppBilling(params: WhatsAppMessageParams) {
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const encodedText = formatWhatsAppMessage(params);

  let fullPhone = cleanPhone;
  if (fullPhone.length === 10 || fullPhone.length === 11) {
    fullPhone = `55${fullPhone}`;
  }

  const url = fullPhone.length >= 12
    ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}