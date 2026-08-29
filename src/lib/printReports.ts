export function printServiceOrder(data: {
  serviceId: string | number;
  deceasedName: string;
  contractNumber: string;
  holderName: string;
  date: string;
  deathCause?: string;
  location?: string;
  casketModel?: string;
  driverName?: string;
  vehiclePlate?: string;
  notes?: string;
}) {
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Serviço - #${data.serviceId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .box { border: 1px solid #ccc; padding: 12px; border-radius: 4px; }
        .box h3 { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #555; }
        .field { margin-bottom: 6px; font-size: 13px; }
        .field strong { color: #000; }
        .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
        .line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 0; } button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">ETERNITY SOS - PLANO FUNERAL</div>
          <div style="font-size: 12px; color: #555;">Ordem de Atendimento de Plantão e Translado</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold;">OS Nº: ${data.serviceId}</div>
          <div style="font-size: 12px;">Emissão: ${data.date}</div>
        </div>
      </div>
      <div class="grid">
        <div class="box">
          <h3>Dados do Atendimento</h3>
          <div class="field"><strong>Falecido(a):</strong> ${data.deceasedName || 'Não informado'}</div>
          <div class="field"><strong>Titular do Plano:</strong> ${data.holderName || 'Não informado'}</div>
          <div class="field"><strong>Nº Contrato:</strong> ${data.contractNumber || 'Não informado'}</div>
          <div class="field"><strong>Causa / Local:</strong> ${data.location || 'Não informado'}</div>
        </div>
        <div class="box">
          <h3>Logística e Insumos</h3>
          <div class="field"><strong>Modelo da Urna:</strong> ${data.casketModel || 'Padrão Contratual'}</div>
          <div class="field"><strong>Motorista / Agente:</strong> ${data.driverName || 'Plantão'}</div>
          <div class="field"><strong>Veículo / Placa:</strong> ${data.vehiclePlate || 'Frota Oficial'}</div>
          <div class="field"><strong>Observações:</strong> ${data.notes || 'Sem observações'}</div>
        </div>
      </div>
      <div class="box" style="margin-bottom: 30px;">
        <h3>Declaração de Recebimento de Serviços</h3>
        <p style="font-size: 12px; line-height: 1.5; color: #333; margin: 0;">
          Declaro para os devidos fins que todos os serviços de assistência funeral descritos nesta Ordem de Serviço foram prestados em conformidade com as cláusulas contratuais vigentes, estando a família plenamente assistida.
        </p>
      </div>
      <div class="signatures">
        <div><div class="line">Assinatura do Responsável Familiar</div></div>
        <div><div class="line">Agente Funerário / Eternity SOS</div></div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function printFinancialReport(data: {
  period: string;
  totalIncome: number;
  totalPending: number;
  transactions: Array<{
    id: string | number;
    description: string;
    amount: number;
    date: string;
    status: string;
  }>;
}) {
  const win = window.open('', '_blank');
  if (!win) return;

  const rows = data.transactions.map(t => `
    <tr>
      <td style="padding: 6px; border: 1px solid #ddd; font-size: 12px;">${t.date}</td>
      <td style="padding: 6px; border: 1px solid #ddd; font-size: 12px;">${t.description}</td>
      <td style="padding: 6px; border: 1px solid #ddd; font-size: 12px; text-transform: uppercase;">${t.status}</td>
      <td style="padding: 6px; border: 1px solid #ddd; font-size: 12px; text-align: right;">R$ ${Number(t.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Balancete Financeiro - ${data.period}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .card { border: 1px solid #ccc; padding: 12px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f0f0f0; padding: 8px; border: 1px solid #ddd; font-size: 12px; text-align: left; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">ETERNITY SOS - RELATÓRIO FINANCEIRO</div>
          <div style="font-size: 12px; color: #555;">Período de Referência: ${data.period}</div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
      <div class="summary">
        <div class="card">
          <div style="font-size: 12px; color: #666;">Total Recebido</div>
          <div style="font-size: 20px; font-weight: bold; color: #16a34a;">R$ ${data.totalIncome.toFixed(2)}</div>
        </div>
        <div class="card">
          <div style="font-size: 12px; color: #666;">Total Pendente / Em Aberto</div>
          <div style="font-size: 20px; font-weight: bold; color: #dc2626;">R$ ${data.totalPending.toFixed(2)}</div>
        </div>
      </div>
      <h3>Detalhamento das Operações</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Status</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="text-align: center; padding: 10px;">Nenhum registro encontrado no período.</td></tr>'}
        </tbody>
      </table>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function printCommissionReceipt(data: {
  sellerName: string;
  period: string;
  totalSales: number;
  commissionAmount: number;
  contractsCount: number;
}) {
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Recibo de Comissões - ${data.sellerName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .box { border: 1px solid #ccc; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { font-size: 14px; margin-bottom: 8px; }
        .highlight { font-size: 22px; font-weight: bold; color: #16a34a; }
        .signatures { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
        .line { border-top: 1px solid #000; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">ETERNITY SOS - RECIBO DE REPASSE DE COMISSÁO</div>
          <div style="font-size: 12px; color: #555;">Controle Interno de Vendas e Produção</div>
        </div>
        <div style="text-align: right; font-size: 12px;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="box">
        <div class="grid">
          <div>
            <div class="field"><strong>Vendedor(a) / Agente:</strong> ${data.sellerName}</div>
            <div class="field"><strong>Competência / Período:</strong> ${data.period}</div>
            <div class="field"><strong>Contratos Ativos Angariados:</strong> ${data.contractsCount}</div>
          </div>
          <div>
            <div class="field"><strong>Volume Total de Vendas:</strong> R$ ${data.totalSales.toFixed(2)}</div>
            <div class="field"><strong>Valor Líquido da Comissão:</strong></div>
            <div class="highlight">R$ ${data.commissionAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="box">
        <p style="font-size: 12px; line-height: 1.5; color: #333; margin: 0;">
          Declaro ter recebido da <strong>ETERNITY SOS</strong> a quantia líquida discriminada acima referente às comissões de intermediação e fechamento de planos funerários no período especificado, conferindo plena e geral quitação.
        </p>
      </div>
      <div class="signatures">
        <div><div class="line">Assinatura do Vendedor / Agente</div></div>
        <div><div class="line">Financeiro / Gestão Eternity SOS</div></div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}