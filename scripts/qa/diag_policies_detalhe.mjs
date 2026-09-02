import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1) Ver TODAS as policies de holders (inclusive as removidas)
console.log('=== POLICIES DE HOLDERS ===');
const pol = (await admin.rpc('query_sql', { q: "SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename='holders'" })).data;
console.log(JSON.stringify(pol, null, 2));

// 2) Ver se RLS está ativa
console.log('\n=== RLS STATUS ===');
const rls = (await admin.rpc('query_sql', { q: "SELECT relname, relrowsecurity FROM pg_class WHERE relname='holders'" })).data;
console.log(JSON.stringify(rls, null, 2));

// 3) Ver definicao da funcao is_superadmin
console.log('\n=== IS_SUPERADMIN ===');
const fn = (await admin.rpc('query_sql', { q: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname='is_superadmin'" })).data;
console.log(JSON.stringify(fn, null, 2));
