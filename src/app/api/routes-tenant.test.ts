import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(process.cwd(), 'src/app/api');

// Rotas isentas: operam sobre tabelas globais ou usam escopo por id do tenant.
const ALLOWLIST = ['webhooks/asaas', 'webhooks/whatsapp', 'webhooks/events', 'webhooks/retry'];
// tenants/route.ts (PATCH): superadmin pode atualizar outro tenant por id
// (comportamento intencional de gestao multi-tenant, role-gated).
const INTENTIONAL_CROSS_TENANT = ['tenants'];
// leads + lead-notes: CRM INTERNO do operador do SaaS — leads são prospects de VENDA do
// próprio sistema, não pertencem a nenhuma funerária (tenant). Rotas gated
// superadmin; tabelas `leads`/`lead_notes` com RLS sem policies (só service role).
const NO_TENANT_SCOPE = ['leads', 'lead-notes'];

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

/**
 * Verifica que toda chamada .update()/.delete() em rota de API inclui filtro
 * de tenant (eq("tenant_id", ...) ou eq("id", auth.tenantId) para a tabela
 * tenants) na mesma cadeia de chamada — automatizando a checagem manual que
 * era feita a cada rodada de auditoria.
 */
function checkStatementScope(src: string): { ok: boolean; failing: number[] } {
  const lines = src.split('\n');
  const failing: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!/\.update\(|\.delete\(/.test(lines[i])) continue;
    // Janela: da linha anterior que abre a cadeia .from( ate o fechamento
    const start = Math.max(0, i - 15);
    const end = Math.min(lines.length, i + 14);
    const window = lines.slice(start, end).join('\n');
    const scoped = /tenant_id|auth\.tenantId/.test(window);
    if (!scoped) failing.push(i + 1);
  }

  return { ok: failing.length === 0, failing };
}

describe('Segurança: todo update/delete em rota de API é tenant-scoped', () => {
  const routeFiles = listRouteFiles(API_DIR);

  it('encontra rotas suficientes para testar (>= 20)', () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(20);
  });

  for (const file of routeFiles) {
    const rel = path.relative(API_DIR, file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf-8');

    const hasMutation = /\.update\(|\.delete\(/.test(src);
    if (!hasMutation) continue;

    const whitelisted =
      ALLOWLIST.some((w) => rel.startsWith(w)) ||
      INTENTIONAL_CROSS_TENANT.some((w) => rel.startsWith(w)) ||
      NO_TENANT_SCOPE.some((w) => rel.startsWith(w));

    it(`filtra por tenant em ${rel}`, () => {
      if (whitelisted) return; // valida por payload/HMAC proprio, aceito
      const result = checkStatementScope(src);
      if (!result.ok) {
        throw new Error(
          `update/delete sem filtro de tenant nas linhas: ${result.failing.join(', ')}`,
        );
      }
    });
  }
});
