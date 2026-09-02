import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1) Listar TODAS as tabelas publicas
const tables = (await admin.rpc('query_sql', { q: "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename" })).data;
console.log('=== TABELAS PUBLICAS ===');
console.log(JSON.stringify(tables?.map(r => r.tablename), null, 2));

// 2) Verificar RLS em cada tabela
const rls = (await admin.rpc('query_sql', { q: "SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' ORDER BY relname" })).data;
console.log('\n=== RLS STATUS ===');
console.log(JSON.stringify(rls, null, 2));

// 3) Verificar colunas de cada tabela (para ver se tem tenant_id)
const cols = (await admin.rpc('query_sql', { q: "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND column_name='tenant_id' ORDER BY table_name" })).data;
console.log('\n=== TABELAS COM tenant_id ===');
console.log(JSON.stringify(cols?.map(r => r.table_name), null, 2));
