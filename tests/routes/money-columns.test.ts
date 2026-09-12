import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

// ============================================================
// REGRESSÃO DE DINHEIRO: colunas que o PostgREST NÃO aceita
// (introspecção do banco vivo) e invariantes de idempotência.
// F-01/F-07 da auditoria — impedir reintrodução.
// ============================================================
describe('Regressão: colunas de dinheiro e idempotência', () => {
  it('billing/pix grava somente colunas que existem em payments', () => {
    const src = readSrc('src/app/api/billing/pix/route.ts');
    // colunas inexistentes no banco vivo (payments): pix_qr_code, pix_copy_paste, boleto_url
    expect(src).not.toMatch(/pix_qr_code:\s|pix_copy_paste:|boleto_url:/);
    // colunas reais
    expect(src).toMatch(/pix_code:\s*qrData\.payload/);
    expect(src).toMatch(/pix_qr_code_url:\s*qrData\.encodedImage/);
    // a falha de vinculação NÃO pode ser engolida (sem asaas_payment_id o webhook não concilia)
    expect(src).toMatch(/linkErr/);
  });

  it('billing/boleto emite boleto REAL no Asaas (não só insert local)', () => {
    const src = readSrc('src/app/api/billing/boleto/route.ts');
    expect(src).toMatch(/getAsaasConfigForTenant/);
    expect(src).toMatch(/billingType: 'BOLETO'/);
    expect(src).toMatch(/externalReference/);
    expect(src).toMatch(/onConflict: 'asaas_payment_id'/);
    // insert local puro sem gateway é o bug F-04 — não pode voltar
    expect(src).not.toMatch(/payments'\)\.insert\(\[\{/);
    expect(src).toMatch(/withTimeout/);
  });

  it('billing/pix nunca envia CPF 00000000000 ao Asaas (F-10)', () => {
    const src = readSrc('src/app/api/billing/pix/route.ts');
    expect(src).not.toMatch(/'00000000000'/);
    expect(src).toMatch(/Titular sem CPF/);
  });

  it('payment-carnets distribui centavos (soma das parcelas = total)', () => {
    const src = readSrc('src/app/api/payment-carnets/route.ts');
    expect(src).toMatch(/totalCents/);
    expect(src).toMatch(/remainderCents/);
    expect(src).toMatch(/installmentCents\(i\)/);
    // o antigo toFixed(2) que perdia centavos não pode voltar
    expect(src).not.toMatch(/amount \/ numInstallments\)\.toFixed/);
  });

  it('webhooks/retry usa paid_at (não paid_date) e transição idempotente', () => {
    const src = readSrc('src/app/api/webhooks/retry/route.ts');
    expect(src).not.toMatch(/paid_date/);
    expect(src).toMatch(/paid_at/);
    expect(src).toMatch(/\.neq\('status',\s*'paid'\)/);
    expect(src).toMatch(/generateCommission/);
    // metadados de retry não podem abortar o reprocessamento
    expect(src).not.toMatch(/Erro ao atualizar evento\./);
  });

  it('webhook principal e retry compartilham generateCommission da lib', () => {
    const webhook = readSrc('src/app/api/webhooks/asaas/route.ts');
    expect(webhook).toMatch(/from '@\/lib\/commissions'/);
    expect(webhook).not.toMatch(/async function generateCommission/);
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/commissions.ts'))).toBe(true);
  });
});
