import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Ver todos os holders e seus tenants
const { data: holders } = await admin.from('holders').select('id, full_name, tenant_id').limit(10);
console.log('=== HOLDERS ===');
console.log(JSON.stringify(holders, null, 2));

// Ver o tenant do qa.cliente
const { data: clienteRole } = await admin.from('user_roles').select('user_id, tenant_id, role').eq('user_id', (await admin.auth.admin.listUsers({ perPage: 1000, page: 1 })).data?.users?.find(u => u.email === 'qa.cliente@exemplo.com')?.id).maybeSingle();
console.log('=== CLIENTE ROLE ===');
console.log(JSON.stringify(clienteRole, null, 2));

// Ver todos os tenants
const { data: tenants } = await admin.from('tenants').select('id, name, cnpj').limit(10);
console.log('=== TENANTS ===');
console.log(JSON.stringify(tenants, null, 2));
