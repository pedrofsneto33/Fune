import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

const page = () => readSrc('src/app/page.tsx');

// ============================================================
// GATE DE AUTENTICAÇÃO FAIL-CLOSED (F-03/F-08/F-09)
// ============================================================
describe('Regressão: gate de auth e dados reais', () => {
  it('nunca inicia o usuário como admin (fail-closed)', () => {
    const src = page();
    expect(src).not.toMatch(/useState<UserRole>\("admin"\)/);
    expect(src).toMatch(/useState<UserRole \| null>\(null\)/);
    expect(src).toMatch(/setPendingApproval\(true\)/);
  });

  it('remove o auto-cadastro (ERP B2B: onboarding por convite do admin)', () => {
    const src = page();
    expect(src).not.toMatch(/auth\.signUp\(/);
    expect(src).toMatch(/Auto-cadastro desativado/);
  });

  it('não renderiza dados mockados como operação real', () => {
    const src = page();
    // padrão de MOCK DE ESTADO (não confundir com textos de template de impressão
    // do Termo de Adesão, que citam itens como "Cadeira de Rodas" legitimamente)
    expect(src).not.toMatch(/item_name: "Urna Luxo Sextavada Mogno"/);
    expect(src).not.toMatch(/holder_name: "Carlos Eduardo Silva"/);
    expect(src).not.toMatch(/useState<InventoryItem\[\]>\(\[\{/);
    expect(src).not.toMatch(/useState<ConvalescenceItem\[\]>\(\[\{/);
    // fetch de inventário sobrescreve também com array vazio
    expect(src).toMatch(/if \(Array\.isArray\(invData\)\) setInventory\(invData\)/);
  });

  it('tela de pendência de aprovação existe', () => {
    expect(page()).toMatch(/Acesso pendente de aprovação/);
  });
});
