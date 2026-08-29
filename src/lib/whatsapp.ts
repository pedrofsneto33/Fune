export function formatWhatsAppMessage(params: {
  holderName: string;
  planName?: string;
  phone?: string;
  amount?: string | number;
  dueDate?: string;
  bankSlipUrl?: string;
  identificationField?: string;
  installmentCount?: number;
  tenantName?: string;
}) {
  const {
    holderName,
    planName = 'Plano Funerário',
    amount,
    dueDate,
    bankSlipUrl,
    identificationField,
    installmentCount = 1,
    tenantName = 'Eternity SOS'
  } = params;

  let message = `Olá, *${holderName}*! 👋\n\n`;
  message += `Aqui é do atendimento *${tenantName}* referente ao seu contrato (*${planName}*).\n\n`;

  if (installmentCount > 1) {
    message += `📄 Segue o seu *Carnê Anual/Parcelado* (${installmentCount} parcelas).\n`;
  } else {
    message += `📄 Segue o seu *Boleto de Mensalidade* no valor de *R$ ${amount}*.\n`;
  }

  if (dueDate) {
    message += `🗓️ *Vencimento:* ${dueDate}\n`;
  }

  if (identificationField) {
    message += `\n🔢 *Linha Digitável (Copie e Cole no seu banco):*\n\`${identificationField}\`\n`;
  }

  if (bankSlipUrl) {
    message += `\n🔗 *Link para Visualizar / Baixar o Carnê em PDF:*\n${bankSlipUrl}\n`;
  }

  message += `\nQualquer dúvida, estamos à sua inteira disposição 24h!\n*${tenantName}*`;

  return encodeURIComponent(message);
}

export function openWhatsAppBilling(params: {
  phone?: string;
  holderName: string;
  planName?: string;
  amount?: string | number;
  dueDate?: string;
  bankSlipUrl?: string;
  identificationField?: string;
  installmentCount?: number;
  tenantName?: string;
}) {
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const encodedText = formatWhatsAppMessage(params);

  // Se tiver DDD mas não tiver código do país 55, adiciona
  let fullPhone = cleanPhone;
  if (fullPhone.length === 10 || fullPhone.length === 11) {
    fullPhone = `55${fullPhone}`;
  }

  const url = fullPhone.length >= 12
    ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(url, '_blank');
}