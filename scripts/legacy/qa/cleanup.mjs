// QA - cleanup: remove tudo que os testes criaram
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const emails = ['qa.cliente@exemplo.com', 'qa.super@exemplo.com', 'qa.novato@exemplo.com'];

// 1. Acha os tenants de teste
const { data: cnpjTeste } = await supabase.from('tenants').select('id').eq('cnpj', '12.345.678/0001-90').maybeSingle();
const { data: cnpjIso } = await supabase.from('tenants').select('id').eq('cnpj', '98.765.432/0001-01').maybeSingle();
const tenantIds = [cnpjTeste?.id, cnpjIso?.id].filter(Boolean);

// 2. Remove dados de teste (dependencias primeiro)
for (const tid of tenantIds) {
  await supabase.from('holders').delete().eq('tenant_id', tid);
  await supabase.from('user_roles').delete().eq('tenant_id', tid);
  await supabase.from('plans').delete().eq('tenant_id', tid);
}
// deleta tenants (fora das dependencias)
for (const tid of tenantIds) {
  await supabase.from('tenants').delete().eq('id', tid);
}

// 3. Remove usuarios de teste
const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
for (const u of (users?.users || [])) {
  if (emails.includes(u.email?.toLowerCase())) {
    await supabase.auth.admin.deleteUser(u.id);
    console.log('[cleanup] removido usuario:', u.email);
  }
}
console.log(`[cleanup] removidos tenants de teste: ${tenantIds.length}`);
console.log('[cleanup] concluido');