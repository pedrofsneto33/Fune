// QA - testes de BANCO: RLS, isolamento de tenant, constraints, superadmin bypass
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const ANON_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANON_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Faltam variaveis no .env.local');
  process.exit(1);
}

let pass = 0, fail = 0;
function check(name, ok, extra = '') {
  if (ok) { pass++; console.log(`  ✅ ${name}${extra ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

// Clientes anonimos (REST) para simular usuario logado
const authHeadersFor = async (email, password) => {
  const c = createClient(ANON_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
};

const adminApi = createClient(ANON_URL, SERVICE_KEY);

// 1. Admin pode ver tudo (service role, nao sofre RLS)
const { data: allTenants } = await adminApi.from('tenants').select('id');
check('service_role acessa tenants', (allTenants || []).length >= 2, `total tenants=${(allTenants || []).length}`);

// 2. RLS aplicado ao cliente ADMIN do tenant de teste: pode ver apenas o proprio tenant
const { data: tenTeste } = await adminApi.from('tenants').select('id, name').eq('cnpj', '12.345.678/0001-90').maybeSingle();
const { data: tenIso } = await adminApi.from('tenants').select('id, name').eq('cnpj', '98.765.432/0001-01').maybeSingle();

const hdrCliente = await authHeadersFor('qa.cliente@exemplo.com', 'QaCliente123!');

// tenants: RLS ativa + policy self_or_super -> cliente ve EXATAMENTE 1 (o proprio tenant)
const r1 = await fetch(`${ANON_URL}/rest/v1/tenants?select=id`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
check('cliente ve apenas o proprio tenant (1)', Array.isArray(r1) && r1.length === 1, `vistos=${Array.isArray(r1) ? r1.length : 'erro'} ${JSON.stringify(r1).slice(0, 80)}`);

// user_roles: policy self_or_super -> cliente ve SO o proprio registro (1)
const r2 = await fetch(`${ANON_URL}/rest/v1/user_roles?select=id,user_id,role`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
const selfOnlyUser = Array.isArray(r2) && r2.length === 1;
check('cliente ve apenas seu proprio user_role (1)', selfOnlyUser, `vistos=${Array.isArray(r2) ? r2.length : 'erro'} ${JSON.stringify(r2).slice(0, 80)}`);

// holders: cliente ve apenas os 2 do proprio tenant (QA Holder Um/Dois)
const r3 = await fetch(`${ANON_URL}/rest/v1/holders?select=id,full_name,tenant_id`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
const onlyOwn = Array.isArray(r3) && r3.length === 2 && r3.every(h => h.tenant_id === tenTeste.id);
check('cliente ve apenas os 2 holders do proprio tenant', onlyOwn, `vistos=${Array.isArray(r3) ? r3.length : 'erro'} ${JSON.stringify(r3).slice(0, 120)}`);

// Forasteiro deve estar INVISIVEL para o cliente
const r4 = await fetch(`${ANON_URL}/rest/v1/holders?select=id&tenant_id=eq.${tenIso.id}`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
check('cliente nao ve holder de OUTRO tenant (0)', Array.isArray(r4) && r4.length === 0, `vistos=${Array.isArray(r4) ? r4.length : 'erro'}`);

// 3. Superadmin (qa.super) tem bypass: ve o forasteiro do outro tenant
const { data: fora } = await adminApi.from('holders').select('id').eq('tenant_id', tenIso.id).limit(1).single();
const hdrSuper = await authHeadersFor('qa.super@exemplo.com', 'QaSuper123!');
const r5 = await fetch(`${ANON_URL}/rest/v1/holders?select=id&id=eq.${fora.id}`, { headers: { ...hdrSuper, apikey: ANON_KEY } }).then(r => r.json());
check('superadmin bypass de RLS (ve cross-tenant)', Array.isArray(r5) && r5.length === 1, `vistos=${Array.isArray(r5) ? r5.length : 'erro'}`);

// 4. Constraint de role valida (limita valores): inserir role invalida deve falhar
const superId = (await adminApi.auth.admin.listUsers({ perPage: 1000, page: 1 })).data?.users?.find(u => u.email === 'qa.super@exemplo.com')?.id;
const { error: roleErr } = await adminApi
  .from('user_roles')
  .insert({ user_id: superId, tenant_id: tenTeste.id, role: 'hacker' });
check('constraint rejeita role "hacker"', !!roleErr, roleErr?.message || '');

// 5. Constraint de plano comercial valida
const { error: planErr } = await adminApi
  .from('tenants')
  .update({ commercial_plan: 'free-trial' })
  .eq('id', tenIso.id);
check('constraint rejeita plano invalido', !!planErr, planErr?.message || '');

console.log(`\n==== RESULTADO DB/RLS: ${pass} passaram, ${fail} falharam ====`);
process.exit(fail ? 1 : 0);