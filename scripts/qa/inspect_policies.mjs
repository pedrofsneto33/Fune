// QA - diagnostico: policies RLS e estado das tabelas criticas
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

async function runSql(query) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`SQL ERROR (${res.status}): ${t.slice(0, 300)}`);
  }
  return res.json();
}

console.log('\n=== POLICIES de holders ===');
try {
  const rows = await runSql(`
    SELECT policyname, tablename, cmd, roles, qual, with_check
    FROM pg_policies WHERE schemaname='public' AND tablename IN ('holders','tenants','user_roles','plans')
    ORDER BY tablename;
  `);
  console.log(JSON.stringify(rows, null, 2) || '(nenhuma policy)');
} catch (e) {
  console.error('erro:', e.message);
}

console.log('\n=== RLS habilitada? ===');
try {
  const rows = await runSql(`
    SELECT relname, relrowsecurity, relforcerowsecurity
    FROM pg_class WHERE relname IN ('holders','tenants','user_roles','plans');
  `);
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error('erro:', e.message);
}

console.log('\n=== get_user_tenant_id / is_superadmin (definicoes) ===');
try {
  const rows = await runSql(`
    SELECT proname, pg_get_functiondef(oid) AS def
    FROM pg_proc WHERE proname IN ('get_user_tenant_id','is_superadmin');
  `);
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error('erro:', e.message);
}