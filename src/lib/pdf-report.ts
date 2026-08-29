export interface EmergencyDispatch {
  id?: string | number;
  protocol?: string | number;
  deceased_name?: string;
  deceasedName?: string;
  contract_number?: string;
  contractNumber?: string;
  holder_name?: string;
  holderName?: string;
  service_date?: string;
  date?: string;
  location?: string;
  driver_name?: string;
  driverName?: string;
  vehicle_plate?: string;
  vehiclePlate?: string;
  notes?: string;
  status?: string;
  cause_of_death?: string;
  casketModel?: string;
  [key: string]: any;
}

export function generateEmergencyOS(data: EmergencyDispatch | any) {
  const win = window.open('', '_blank');
  if (!win) return;

  const id = data.protocol || data.id || 'N/A';
  const deceased = data.deceased_name || data.deceasedName || 'Não informado';
  const holder = data.holder_name || data.holderName || 'Não informado';
  const contract = data.contract_number || data.contractNumber || 'Não informado';
  const loc = data.location || 'Não informado';
  const driver = data.driver_name || data.driverName || 'Plantão';
  const plate = data.vehicle_plate || data.vehiclePlate || 'Oficial';
  const notes = data.notes || 'Sem observações';
  const date = data.service_date || data.date || new Date().toLocaleDateString('pt-BR');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Serviço Emergencial - #${id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .box { border: 1px solid #ccc; padding: 14px; margin-bottom: 16px; border-radius: 4px; }
        .field { margin-bottom: 6px; font-size: 13px; }
        .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
        .line { border-top: 1px solid #000; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">ETERNITY SOS - ORDEM DE SERVIÇO EMERGENCIAL</div>
          <div style="font-size: 12px; color: #555;">Atendimento de Plantão Funeral 24 Horas</div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <strong>OS Nº: ${id}</strong><br>Data: ${date}
        </div>
      </div>
      <div class="box">
        <div class="field"><strong>Falecido(a):</strong> ${deceased}</div>
        <div class="field"><strong>Titular do Plano:</strong> ${holder}</div>
        <div class="field"><strong>Nº Contrato:</strong> ${contract}</div>
        <div class="field"><strong>Local / Endereço da Ocorrência:</strong> ${loc}</div>
      </div>
      <div class="box">
        <div class="field"><strong>Agente / Motorista:</strong> ${driver}</div>
        <div class="field"><strong>Veículo / Placa:</strong> ${plate}</div>
        <div class="field"><strong>Observações Operacionais:</strong> ${notes}</div>
      </div>
      <div class="signatures">
        <div><div class="line">Responsável Familiar / Contratante</div></div>
        <div><div class="line">Plantão Operacional / Eternity SOS</div></div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function generateExecutiveReport(...args: any[]) {
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Executivo Geral</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
        .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .card { border: 1px solid #ccc; padding: 14px; margin-bottom: 15px; border-radius: 4px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">ETERNITY SOS - RELATÓRIO EXECUTIVO GERENCIAL</div>
        <div style="font-size: 12px; color: #555;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="card">
        <p>Relatório sintético consolidado de métricas e indicadores de desempenho operacional e financeiro.</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function generatePlantaoReportPDF(...args: any[]) {
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Plantão</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
        .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">ETERNITY SOS - ESCALA E RELATÓRIO DE PLANTÃO</div>
        <div style="font-size: 12px; color: #555;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <p>Relatório das ocorrências registradas pela equipe técnica de plantão funerário.</p>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function generateContractPDF(contract: any) {
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Contrato de Adesão - #${contract.id || ''}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .section { margin-bottom: 20px; }
        .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
        .line { border-top: 1px solid #000; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">ETERNITY SOS - CONTRATO DE ASSISTÊNCIA FUNERAL FAMILIAR</div>
        <div style="font-size: 12px; color: #555;">Contrato Nº: ${contract.id || 'N/A'}</div>
      </div>
      <div class="section">
        <p><strong>Titular:</strong> ${contract.holder_name || 'Não informado'}</p>
        <p><strong>CPF:</strong> ${contract.cpf || 'Não informado'}</p>
        <p><strong>Plano:</strong> ${contract.plan_type || 'Plano Familiar Padrão'}</p>
        <p><strong>Valor Mensal:</strong> R$ ${Number(contract.monthly_fee || 89.90).toFixed(2)}</p>
      </div>
      <div class="signatures">
        <div><div class="line">Assinatura do Titular</div></div>
        <div><div class="line">Eternity SOS</div></div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}

export * from './printReports';