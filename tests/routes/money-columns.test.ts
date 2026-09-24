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
