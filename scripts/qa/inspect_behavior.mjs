// QA - diagnostico comportamental da RLS (sem acesso a SQL direto)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const ANON_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(ANON_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function clientWith(email, password) {
  const c = createClient(ANON_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

// 1. Panorama via service role
const { data: allTen } = await admin.from('tenants').select('id, name, cnpj, status');
console.log('\n[TODOS OS TENANTS (service role)]');
for (const t of allTen || []) console.log(`  ${t.id} | ${t.name} | ${t.cnpj} | ${t.status}`);

const { data: allHold } = await admin.from('holders').select('id, full_name, tenant_id');
console.log(`\n[TODOS OS HOLDERS: ${(allHold || []).length}]`);
for (const h of allHold || []) console.log(`  ${h.full_name} -> tenant ${h.tenant_id}`);

// 2. O que o cliente ve (qa.cliente -> admin do tenant_teste)
const c = await clientWith('qa.cliente@exemplo.com', 'QaCliente123!');
const { data: seeTen } = await c.from('tenants').select('id, name');
console.log(`\n[CLIENTE ve tenants: ${(seeTen || []).length}]`);
for (const t of seeTen || []) console.log(`  ${t.id} | ${t.name}`);

const { data: seeHold } = await c.from('holders').select('id, full_name, tenant_id');
console.log(`\n[CLIENTE ve holders: ${(seeHold || []).length}]`);
for (const h of seeHold || []) console.log(`  ${h.full_name} -> tenant ${h.tenant_id}`);

// 3. Tenta INSERT cross-tenant como cliente (em tenants e holders)
const isoTen = (allTen || []).find(t => t.cnpj === '98.765.432/0001-01');
if (isoTen) {
  const { error: insHold } = await c.from('holders').insert({
    tenant_id: isoTen.id,
    full_name: 'QA invasor',
    cpf: '12323123123',
    phone: '11999999999',
  });
  console.log(`\n[INSERT cross-tenant em holders] ${insHold ? 'BLOQUEADO (RLS ativa): ' + insHold.message : 'PERMITIDO (!!sem RLS!!)'}`);
} else {
  console.log('\n[tenant iso nao encontrado p/ testar INSERT]');
}

// 4. Tenta UPDATE cross-tenant como cliente
const targetHold = (allHold || []).find(h => h.tenant_id === isoTen?.id);
if (targetHold) {
  const { error: upd } = await c.from('holders').update({ full_name: 'QA HACKED' + Date.now() }).eq('id', targetHold.id);
  console.log(`[UPDATE cross-tenant em holder ${targetHold.id}] ${upd ? 'BLOQUEADO: ' + upd.message : 'PERMITIDO (!!)'}`);
} else {
  console.log('[nenhum holder alvo p/ UPDATE]');
}