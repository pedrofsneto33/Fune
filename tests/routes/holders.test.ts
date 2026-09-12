import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

// ============================================================
// F-15 (sem N+1), F-11 (soft delete), F-19 (digitos do CPF)
// ============================================================
describe('Regressão: holders (N+1, soft delete, CPF)', () => {
  it('GET de titulares usa queries em lote (.in) e nao tem N+1', () => {
    const src = readSrc('src/app/api/holders/route.ts');
    expect(src).toMatch(/\.in\("holder_id", holderIds\)/);
    // nenhum titular dispara queries individuais de dependentes/contratos
    expect(src).not.toMatch(/\.eq\("holder_id", h\.id\)/);
    expect(src).not.toMatch(/holdersList\.map\(async \(h\)/);
  });

  it('DELETE de titular eh soft delete (nao destrutivo)', () => {
    const src = readSrc('src/app/api/holders/route.ts');
    expect(src).toMatch(/update\(\{ status: "inativo" \}\)/);
    expect(src).toMatch(/Titular já está inativo/);
    // remocao fisica e cascade estao removidos
    expect(src).not.toMatch(/from\("contracts"\)\.delete\(\)/);
    expect(src).not.toMatch(/from\("holders"\)\.delete\(\)/);
  });

  it('isValidCPF valida os digitos verificadores', () => {
    const src = readSrc('src/lib/validation.ts');
    expect(src).toMatch(/length !== 11/);
    expect(src).toMatch(/parseInt\(digits\[9\]/);
    expect(src).toMatch(/parseInt\(digits\[10\]/);
  });
});
