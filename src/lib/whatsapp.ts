interface SendMessageParams {
  phone: string;
  message: string;
}

export const sendWhatsAppNotification = async ({ phone, message }: SendMessageParams) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY;
  const instanceName = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'saadfune';

  // Se houver Evolution API configurada, dispara em segundo plano via POST
  if (apiUrl && apiKey) {
    try {
      const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: formattedPhone,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false
          },
          textMessage: {
            text: message
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Falha no gateway WhatsApp: ${response.statusText}`);
      }

      return { success: true, method: 'api' };
    } catch (err) {
      console.warn('Falha no disparo via API, utilizando fallback nativo:', err);
    }
  }

  // Fallback: Retorna URL para abertura direta no WhatsApp Web / App
  const webUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  return { success: true, method: 'redirect', url: webUrl };
};

export const formatWhatsAppMessage = ({
  phone,
  customerName,
  planName,
  amount,
  dueDate,
  pixCode
}: {
  phone: string;
  customerName: string;
  planName: string;
  amount: string;
  dueDate: string;
  pixCode: string;
}) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  const msg = `Olá, *${customerName}*!\n\n` +
    `Informamos que a fatura do seu plano *${planName}* no valor de *${amount}* vence em *${dueDate}*.\n\n` +
    `Para pagar via PIX copia e cola, utilize a chave abaixo:\n\n` +
    `\`${pixCode}\`\n\n` +
    `_SAAD FUNE • Assistência Familiar 24h_`;

  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
};