import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(process.cwd(), 'src/app/api');

// Rotas que por design não usam withAuth (validação propria, ex.: webhook de pagamento)
const ALLOWLIST = ['webhooks/asaas', 'webhooks/whatsapp'];

function listRouteFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...listRouteFiles(full));
    } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
      found.push(full);
    }
  }
  return found;
}

describe('Segurança: toda rota de API exige autenticação', () => {
  const routeFiles = listRouteFiles(API_DIR);

  it('encontra rotas suficientes para testar (>= 20)', () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(20);
  });

  for (const file of routeFiles) {
    const rel = path.relative(API_DIR, file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf-8');

    const exportedMethods =
      (src.match(/export const (GET|POST|PUT|PATCH|DELETE)\s*=/g) || []).length +
      (src.match(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g) || []).length;

    const whitelisted = ALLOWLIST.some((w) => rel.startsWith(w));

    it(`exige autenticação em ${rel}`, () => {
      expect(exportedMethods).toBeGreaterThan(0);
      if (whitelisted) return; // validação propria (HMAC/secret), aceita
      const usesWithAuth = /withAuth\s*\(/g.test(src);
      const manualTokenCheck = /auth\.getUser\(/g.test(src);
      expect(usesWithAuth || manualTokenCheck).toBe(true);
    });
  }
});