import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Insert com cpf
const r = await admin.from('holders').insert({ full_name: 'QA Test', cpf: '999.888.777-66', tenant_id: 'f87ebd29-8b44-407a-bcc9-38f40d4aa91a' }).select();
console.log('Resultado:', JSON.stringify(r, null, 2));
