import * as fs from 'fs';
import * as path from 'path';

const readSrc = (rel: string): string =>
  fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

const home = () => readSrc('src/app/page.tsx');
const dashLayout = () => readSrc('src/app/(dashboard)/layout.tsx');
const guard = () => readSrc('src/components/AuthGuard.tsx');

// ============================================================
// POS-MONOLITO (Fase 6g-6d): HomeRedirect + shell role-aware
// ============================================================
describe('Regressao: pos-monolito (HomeRedirect + shell)', () => {
  it('monolito removido: home exporta HomePage (sem monolito)', () => {
    const src = home();
    expect(src).toMatch(/export default function HomePage/);
    expect(src).toMatch(/HomeRedirect/);
  });

  it('home redireciona por role via init-user + NAV_GROUPS', () => {
    const src = home();
    expect(src).toMatch(/authFetch\('\/api\/init-user'/);
    expect(src).toMatch(/NAV_GROUPS/);
    expect(src).toMatch(/isTabAllowed/);
    expect(src).toMatch(/router\.replace\('\/titulares'\)/);
  });

  it('shell do dashboard exporta NAV_GROUPS e trata pendencia', () => {
    const src = dashLayout();
    expect(src).toMatch(/export const NAV_GROUPS/);
    expect(src).toMatch(/pending/);
    expect(src).toMatch(/PendingApprovalScreen/);
  });

  it('AuthGuard detecta signOut e redireciona para /login', () => {
    const src = guard();
    expect(src).toMatch(/onAuthStateChange/);
    expect(src).toMatch(/router\.replace\('\/login'\)/);
  });

  it('shell do dashboard tem botao Sair', () => {
    const src = dashLayout();
    expect(src).toMatch(/handleSignOut/);
    expect(src).toMatch(/supabase\.auth\.signOut/);
  });
});
