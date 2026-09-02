// Validação rápida do RBAC via SERVICE_ROLE (apenas leitura)
// Uso: node scripts/check_superadmin.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const email = process.argv[2] || 'pedrofsneto33@gmail.com';

const { data: users } = await supabase.auth.admin.listUsers({ perPage: 200 });
const user = (users?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!user) {
  console.log('USUARIO NAO ENCONTRADO no auth:', email);
  process.exit(1);
}

const { data: roles, error } = await supabase
  .from('user_roles')
  .select('id, user_id, tenant_id, role, created_at')
  .eq('user_id', user.id);

if (error) {
  console.log('ERRO ao ler user_roles:', error.message);
  process.exit(1);
}

console.log('========================================');
console.log('USUARIO: ', user.email, '(', user.id, ')');
console.log('Creou em:', user.created_at);
console.log('----------------------------------------');
if (!roles || roles.length === 0) {
  console.log('SEM PAPEL ATRIBUIDO (acesso pendente).');
} else {
  for (const r of roles) {
    const { data: ten } = await supabase
      .from('tenants')
      .select('name, status, commercial_plan')
      .eq('id', r.tenant_id)
      .single();
    console.log(`ROLE = ${r.role.toUpperCase().padEnd(12)} | tenant: ${ten?.name || r.tenant_id} | status: ${ten?.status} | plano: ${ten?.commercial_plan}`);
  }
}
console.log('========================================');