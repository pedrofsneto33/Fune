import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

// ============================================================
// F-14 (mojibake) e F-17 (CSP permite estilos inline)
// ============================================================
describe('Regressão: encoding e CSP', () => {
  it('src/ não contém mais mojibake UTF-8/Latin-1 (padrões ÃX)', () => {
    const root = path.join(process.cwd(), 'src');
    const offenders: string[] = [];
    for (const dir of ['app', 'lib', 'components', 'config', 'hooks']) {
      const base = path.join(root, dir);
      for (const f of fs.readdirSync(base)) {
        if (!f.endsWith('.ts') && !f.endsWith('.tsx')) continue;
        const txt = fs.readFileSync(path.join(base, f), 'utf-8');
        // Ã seguido de byte alto (0x80-0xBF) = mojibake; Ã£/Ã§/Ã³ etc.
        if (/[\u00C3][\u0080-\u00BF]/.test(txt)) {
          offenders.push(`${dir}/${f}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('CSP do middleware permite estilos inline (style-src unsafe-inline)', () => {
    const src = readSrc('src/middleware.ts');
    expect(src).toMatch(/style-src 'self' 'nonce-\$\{nonce\}' 'unsafe-inline'/);
  });
});
