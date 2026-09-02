import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Tentar insert e capturar erro
const clienteUser = (await admin.auth.admin.listUsers({ perPage: 1000, page: 1 })).data?.users?.find(u => u.email === 'qa.cliente@exemplo.com');
console.log('clienteUser:', clienteUser?.id, clienteUser?.email);

const result = await admin.from('holders').insert({ full_name: 'QA Test Holder', tenant_id: 'f87ebd29-8b44-407a-bcc9-38f40d4aa91a', created_by: clienteUser?.id }).select('id').single();
console.log('insert result:', JSON.stringify(result, null, 2));
