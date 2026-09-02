// QA - testes de API com autenticacao real (precisa do servidor rodando em $BASE)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const BASE = process.env.BASE || 'http://localhost:3210';
const ANON_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function tokenFor(email, password) {
  const c = createClient(ANON_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return data.session.access_token;
}

async function call(token, path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

let pass = 0, fail = 0;
function check(name, ok, extra = '') {
  if (ok) { pass++; console.log(`  ✅ ${name}${extra ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

// Espera o servidor subir (ate 60s)
let up = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${BASE}/`); if (r) { up = true; break; } } catch { /* retry */ }
  await new Promise(res => setTimeout(res, 2000));
}
if (!up) {
  console.error('Servidor não subiu em 60s. Rode: npx next start -p 3210');
  process.exit(1);
}

const tokCliente = await tokenFor('qa.cliente@exemplo.com', 'QaCliente123!');
const tokSuper = await tokenFor('qa.super@exemplo.com', 'QaSuper123!');

console.log('\n--- CLIENTE (admin do tenant teste) ---');
let r = await call(tokCliente, '/api/tenants');
check('GET /api/tenants ok', r.status === 200 && r.json?.success);
check('cliente recebe 1 tenant + can_manage_plan:false', r.json?.tenants?.length === 1 && r.json.can_manage_plan === false, `tenants=${r.json?.tenants?.length}`);

r = await call(tokCliente, '/api/users/roles');
check('GET /api/users/roles ok', r.status === 200 && r.json?.success);
check('cliente is_superadmin:false', r.json?.is_superadmin === false);

// Rebaixar superadmin como administrador -> 403
r = await call(tokCliente, '/api/users/roles', 'POST', { email: 'qa.super@exemplo.com', role: 'admin' });
check('admin nao pode rebaixar superadmin (403)', r.status === 403, JSON.stringify(r.json).slice(0, 80));

// Conceder superadmin como administrador -> 403
r = await call(tokCliente, '/api/users/roles', 'POST', { email: 'qa.cliente@exemplo.com', role: 'superadmin' });
check('admin nao pode conceder superadmin (403)', r.status === 403, JSON.stringify(r.json).slice(0, 80));

// Remover proprio acesso -> 400
const rolesMe = (await call(tokCliente, '/api/users/roles')).json?.roles || [];
const myRole = rolesMe.find(x => x.email === 'qa.cliente@exemplo.com');
if (myRole) {
  r = await call(tokCliente, `/api/users/roles?id=${myRole.id}`, 'DELETE');
  check('admin nao pode remover o proprio acesso (400)', r.status === 400, JSON.stringify(r.json).slice(0, 80));
} else {
  check('(setup) role propria encontrada', false);
}

// Remover superadmin como admin -> 403
const rolesMe2 = (await call(tokCliente, '/api/users/roles')).json?.roles || [];
const superRoleId = rolesMe2.find(x => x.email === 'qa.super@exemplo.com')?.id;
if (superRoleId) {
  r = await call(tokCliente, `/api/users/roles?id=${superRoleId}`, 'DELETE');
  check('admin nao pode remover superadmin (403)', r.status === 403, JSON.stringify(r.json).slice(0, 80));
}

// Limite de plano: adicionar 3o usuario -> 402
r = await call(tokCliente, '/api/users/roles', 'POST', { email: 'qa.novato@exemplo.com', role: 'attendant' });
check('plano essencial bloqueia novo usuario (402 PLAN_LIMIT)', r.status === 402, JSON.stringify(r.json).slice(0, 80));

console.log('\n--- SUPERADMIN (qa.super) ---');
r = await call(tokSuper, '/api/tenants');
check('GET /api/tenants ok', r.status === 200 && r.json?.success);
check('superadmin ve TODOS tenants + can_manage_plan:true', r.json?.tenants?.length >= 2 && r.json.can_manage_plan === true, `tenants=${r.json?.tenants?.length}`);

r = await call(tokSuper, '/api/users/roles');
check('superadmin is_superadmin:true', r.json?.is_superadmin === true);

// Super concede superadmin (sem violar limite? count users sobe se novo; aqui é UPDATE do proprio tenant)
r = await call(tokSuper, '/api/users/roles', 'POST', { email: 'qa.cliente@exemplo.com', role: 'superadmin' });
check('superadmin pode conceder superadmin (update ok)', r.status === 200 || r.status === 201, JSON.stringify(r.json).slice(0, 100));

// Rebaixar qa.cliente de superadmin de volta para admin (agora count super = 2)
r = await call(tokSuper, '/api/users/roles', 'POST', { email: 'qa.cliente@exemplo.com', role: 'admin' });
check('superadmin pode rebaixar outro superadmin (count>1)', r.status === 200 || r.status === 201, JSON.stringify(r.json).slice(0, 80));

// Tentar rebaixar o UNICO superadmin restante -> 400
r = await call(tokSuper, '/api/users/roles', 'POST', { email: 'qa.super@exemplo.com', role: 'admin' });
check('nao pode rebaixar o UNICO superadmin restante (400)', r.status === 400, JSON.stringify(r.json).slice(0, 100));

console.log(`\n==== RESULTADO API: ${pass} passaram, ${fail} falharam ====`);
process.exit(fail ? 1 : 0);