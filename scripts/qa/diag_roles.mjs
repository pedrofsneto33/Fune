// QA - diagnostica papéis dos usuarios QA + counts por tenant
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const emails = ['qa.cliente@exemplo.com', 'qa.super@exemplo.com', 'qa.novato@exemplo.com'];
const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
for (const em of emails) {
  const u = (users?.users || []).find(x => x.email?.toLowerCase() === em.toLowerCase());
  if (!u) { console.log(`${em}: NAO EXISTE no auth`); continue; }
  const { data: roles } = await supabase
    .from('user_roles')
    .select('id, tenant_id, role')
    .eq('user_id', u.id);
  console.log(`${em} -> ${u.id}`);
  for (const r of roles || []) {
    const { data: t } = await supabase.from('tenants').select('name, cnpj').eq('id', r.tenant_id).single();
    console.log(`    ${r.role.toUpperCase().padEnd(10)} | tenant: ${t?.name} (${t?.cnpj})`);
  }
}

// Counts de holders por tenant
const { data: tenants } = await supabase.from('tenants').select('id, name, cnpj');
console.log('\n[holders por tenant]');
for (const t of tenants || []) {
  const { count } = await supabase.from('holders').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id);
  console.log(`  ${t.name} (${t.cnpj}): ${count} holders`);
}