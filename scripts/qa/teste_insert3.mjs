import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY (first 20):', env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));

// Teste 1: insert simples
const r1 = await admin.from('holders').insert({ full_name: 'Test', tenant_id: 'f87ebd29-8b44-407a-bcc9-38f40d4aa91a' }).select();
console.log('Insert simples:', JSON.stringify(r1, null, 2));

// Teste 2: sem select
const r2 = await admin.from('holders').insert({ full_name: 'Test2', tenant_id: 'f87ebd29-8b44-407a-bcc9-38f40d4aa91a' });
console.log('Insert sem select:', JSON.stringify(r2, null, 2));
