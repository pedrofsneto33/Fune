import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

// ============================================================
// SEGURANÇA DO WEBHOOK ASAAS (F-02)
// Doc oficial: origem = token em 'asaas-access-token'. O Asaas
// NÃO assina o corpo (sem HMAC nativo). Idempotência at-least-once.
// ============================================================
describe('Regressão: webhook Asaas', () => {
  const src = readSrc('src/app/api/webhooks/asaas/route.ts');

  it('não contém o mecanismo HMAC inexistente (código morto removido)', () => {
    expect(src).not.toMatch(/ASAAS_WEBHOOK_SECRET/);
    expect(src).not.toMatch(/verifyWebhookSignature/);
    expect(src).not.toMatch(/x-asaas-signature/);
  });

  it('valida o token oficial asaas-access-token', () => {
    expect(src).toMatch(/asaas-access-token/);
    expect(src).toMatch(/Token de webhook ausente/);
  });

  it('deduplica eventos já processados (at-least-once)', () => {
    expect(src).toMatch(/eq\('processed',\s*true\)/);
    expect(src).toMatch(/duplicated/);
  });

  it('suporta whitelist opcional de IPs do Asaas', () => {
    expect(src).toMatch(/ASAAS_ALLOWED_IPS/);
  });
});
