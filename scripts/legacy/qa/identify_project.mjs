// QA - identifica o projeto Supabase real (via URL + dados)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

console.log('NEXT_PUBLIC_SUPABASE_URL =', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('anunciado por ref:', env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://','').split('.')[0]);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: tenants } = await sb.from('tenants').select('id, name, cnpj').order('created_at');
console.log('\nTenants via service role (projeto real):');
for (const t of tenants || []) console.log(`  ${t.name} (${t.cnpj})`);

const { data: roles, error } = await sb
  .from('user_roles')
  .select('user_id, tenant_id, role')
  .limit(20);
console.log(`\nuser_roles (total ate 20): ${roles?.length || 0}`);
for (const r of roles || []) console.log(`  ${r.role} | user=${String(r.user_id).slice(0,8)} | tenant=${String(r.tenant_id).slice(0,8)}`);

console.log('\nEndpoint REST confiável = projeto:', env.NEXT_PUBLIC_SUPABASE_URL);