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

const admin = createClient(ANON_URL, SERVICE_KEY);
const anon = createClient(ANON_URL, ANON_KEY, { auth: { persistSession: false } });

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  if (ok) { pass++; console.log(`  ✅ ${name}${extra ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
};

const TENANT_QA = 'f87ebd29-8b44-407a-bcc9-38f40d4aa91a';
const TENANT_SAAD = 'a0000000-0000-0000-0000-000000000001';

const authHeadersFor = async (email, password) => {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
};

console.log('\n=== QA ISOLAMENTO DEFINITIVO ===\n');

// IDs dos usuarios
const clienteUser = (await admin.auth.admin.listUsers({ perPage: 1000, page: 1 })).data?.users?.find(u => u.email === 'qa.cliente@exemplo.com');

// 1) Setup: criar holder via service role com created_by valido
const newHolder = (await admin.from('holders').insert({ full_name: 'QA Isolamento Test', tenant_id: TENANT_QA, created_by: clienteUser?.id }).select('id').single()).data;
check('setup: criar holder no tenant cliente', !!newHolder?.id, `id=${newHolder?.id?.slice(0,8)}`);

// 2) Cliente ve APENAS o holder do proprio tenant
const hdrCliente = await authHeadersFor('qa.cliente@exemplo.com', 'QaCliente123!');
const rCliente = await fetch(`${ANON_URL}/rest/v1/holders?select=id,full_name,tenant_id`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
const clienteVeSoOwn = Array.isArray(rCliente) && rCliente.length === 1 && rCliente[0].tenant_id === TENANT_QA;
check('cliente ve so 1 holder (do proprio tenant)', clienteVeSoOwn, `vistos=${rCliente?.length}`);

// 3) Cliente NAO pode ver holders de outro tenant
const rFora = await fetch(`${ANON_URL}/rest/v1/holders?select=id&tenant_id=eq.${TENANT_SAAD}`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
check('cliente NAO ve holders de outro tenant', Array.isArray(rFora) && rFora.length === 0, `vistos=${rFora?.length}`);

// 4) Superadmin ve holder do tenant cliente (bypass)
const hdrSuper = await authHeadersFor('qa.super@exemplo.com', 'QaSuper123!');
const rSuper = await fetch(`${ANON_URL}/rest/v1/holders?select=id,tenant_id&id=eq.${newHolder?.id}`, { headers: { ...hdrSuper, apikey: ANON_KEY } }).then(r => r.json());
check('superadmin ve holder do tenant cliente (bypass)', Array.isArray(rSuper) && rSuper.length === 1, `vistos=${rSuper?.length}`);

// 5) Cliente NAO pode criar holder em outro tenant
const rInsert = await fetch(`${ANON_URL}/rest/v1/holders`, {
  method: 'POST',
  headers: { ...hdrCliente, apikey: ANON_KEY, Prefer: 'return=representation' },
  body: JSON.stringify({ full_name: 'HACK ATTEMPT', tenant_id: TENANT_SAAD, created_by: clienteUser?.id })
});
check('cliente NAO pode criar holder em outro tenant (403/401)', rInsert.status === 403 || rInsert.status === 401, `status=${rInsert.status}`);

// 6) Cliente NAO pode deletar holder de outro tenant
const holderSaad = (await admin.from('holders').select('id').eq('tenant_id', TENANT_SAAD).limit(1).single()).data;
const rDelete = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${holderSaad?.id}`, {
  method: 'DELETE',
  headers: { ...hdrCliente, apikey: ANON_KEY }
});
check('cliente NAO pode deletar holder de outro tenant', rDelete.status === 403 || rDelete.status === 401, `status=${rDelete.status}`);

// 7) Cleanup
await admin.from('holders').delete().eq('id', newHolder?.id);
check('cleanup: remover holder de teste', true);

console.log(`\n==== RESULTADO: ${pass} passaram, ${fail} falharam ====\n`);
process.exit(fail ? 1 : 0);
