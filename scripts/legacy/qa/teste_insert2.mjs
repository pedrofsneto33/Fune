import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Ver colunas existentes
const { data } = await admin.from('holders').select('*').limit(1);
if (data && data.length > 0) {
  console.log('Colunas existentes:', Object.keys(data[0]));
} else {
  // Tentar insert sem created_by
  const r = await admin.from('holders').insert({ full_name: 'QA Test', tenant_id: 'f87ebd29-8b44-407a-bcc9-38f40d4aa91a' }).select('id');
  console.log('Insert sem created_by:', JSON.stringify(r, null, 2));
}
