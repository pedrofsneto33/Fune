import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

// ============================================================
// F-12 (validação de veículo fora do bloco errado) e
// F-13 (agente WhatsApp grava campos no passo correto)
// ============================================================
describe('Regressão: service-orders e agente WhatsApp', () => {
  it('service-orders: checagem "Em Missão" NÃO está dentro do if (!ownedContract)', () => {
    const src = readSrc('src/app/api/service-orders/route.ts');
    // o bloco engolido tinha o marcador [CORRECAO] dentro de if (!ownedContract)
    expect(src).not.toMatch(/\[CORRECAO\] Validacao de ve/);
    // a checagem de status existe (POST e/ou PATCH) e NUNCA dentro de
    // if (!ownedContract) — padrão que matava a validação com contrato válido
    const checks = src.match(/já está em missão em outra ordem de serviço/g) || [];
    expect(checks.length).toBeGreaterThanOrEqual(1);
    expect(src).not.toMatch(/if \(!ownedContract\) \{[\s\S]{0,900}já está em missão em outra ordem/);
    expect(src).toMatch(/select\('id, status'\)/);
  });

  it('service-orders: erro de óbito sem mojibake', () => {
    const src = readSrc('src/app/api/service-orders/route.ts');
    expect(src).not.toMatch(/óóóbito/);
  });

  it('whatsappAgent captura cada campo no passo correto', () => {
    const src = readSrc('src/lib/whatsappAgent.ts');
    expect(src).toMatch(/if \(step === 'init'\) data\.deceasedName = text/);
    expect(src).toMatch(/if \(step === 'location'\) data\.location = text/);
    // padrões antigos (campos deslocados) não podem voltar
    expect(src).not.toMatch(/if \(step === 'location'\) data\.deceasedName/);
    expect(src).not.toMatch(/if \(step === 'family'\) data\.location/);
  });
});
