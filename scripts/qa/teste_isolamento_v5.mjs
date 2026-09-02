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
const TENANT_OTHER = 'a0000000-0000-0000-0000-000000000001';

const authHeadersFor = async (email, password) => {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
};

console.log('\n=== QA ISOLAMENTO DEFINITIVO v5 ===\n');

// Setup: criar holders com todos os campos obrigatorios
const ownHolder = (await admin.from('holders').insert({ full_name: 'QA Own Holder', cpf: '111.222.333-44', phone: '(11) 11111-1111', email: 'qaown@holder.com', address: 'Rua A', tenant_id: TENANT_QA }).select('id').single()).data;
const otherHolder = (await admin.from('holders').insert({ full_name: 'QA Other Holder', cpf: '555.666.777-88', phone: '(11) 22222-2222', email: 'qaother@holder.com', address: 'Rua B', tenant_id: TENANT_OTHER }).select('id').single()).data;

check('setup: criar holder no tenant cliente', !!ownHolder?.id, `id=${ownHolder?.id?.slice(0,8)}`);
check('setup: criar holder em outro tenant', !!otherHolder?.id, `id=${otherHolder?.id?.slice(0,8)}`);

const hdrCliente = await authHeadersFor('qa.cliente@exemplo.com', 'QaCliente123!');

// 1) Cliente VE o proprio holder
const r1 = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${ownHolder?.id}&select=id,tenant_id`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
check('cliente VE o proprio holder', Array.isArray(r1) && r1.length === 1, `vistos=${r1?.length}`);

// 2) Cliente NAO VE holder de outro tenant (buscando por ID)
const r2 = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${otherHolder?.id}&select=id,tenant_id`, { headers: { ...hdrCliente, apikey: ANON_KEY } }).then(r => r.json());
check('cliente NAO VE holder de outro tenant (por ID)', Array.isArray(r2) && r2.length === 0, `vistos=${r2?.length}`);

// 3) Cliente NAO PODE deletar holder de outro tenant
const r3 = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${otherHolder?.id}`, {
  method: 'DELETE',
  headers: { ...hdrCliente, apikey: ANON_KEY }
});
check('cliente NAO PODE deletar holder de outro tenant', r3.status === 403 || r3.status === 401, `status=${r3.status}`);

// 4) Verificar via admin que o holder de outro tenant NAO foi deletado
const r4 = await admin.from('holders').select('id').eq('id', otherHolder?.id).maybeSingle();
check('holder de outro tenant ainda existe (admin)', !!r4.data, `existe=${!!r4.data}`);

// 5) Cliente NAO PODE atualizar holder de outro tenant
const r5 = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${otherHolder?.id}`, {
  method: 'PATCH',
  headers: { ...hdrCliente, apikey: ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ full_name: 'HACKED' })
});
check('cliente NAO PODE atualizar holder de outro tenant', r5.status === 403 || r5.status === 401, `status=${r5.status}`);

// 6) Superadmin PODE ver holder de outro tenant
const hdrSuper = await authHeadersFor('qa.super@exemplo.com', 'QaSuper123!');
const r6 = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${otherHolder?.id}&select=id`, { headers: { ...hdrSuper, apikey: ANON_KEY } }).then(r => r.json());
check('superadmin VE holder de outro tenant', Array.isArray(r6) && r6.length === 1, `vistos=${r6?.length}`);

// 7) Cliente PODE deletar o PROPRIO holder
const r7 = await fetch(`${ANON_URL}/rest/v1/holders?id=eq.${ownHolder?.id}`, {
  method: 'DELETE',
  headers: { ...hdrCliente, apikey: ANON_KEY }
});
check('cliente PODE deletar o proprio holder', r7.status === 204, `status=${r7.status}`);

// Cleanup
await admin.from('holders').delete().eq('id', otherHolder?.id);
check('cleanup', true);

console.log(`\n==== RESULTADO: ${pass} passaram, ${fail} falharam ====\n`);
process.exit(fail ? 1 : 0);
