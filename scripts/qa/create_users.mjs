// QA - cria usuários de teste no auth (idempotente)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const USERS = [
  { email: 'qa.cliente@exemplo.com', password: 'QaCliente123!' },
  { email: 'qa.super@exemplo.com', password: 'QaSuper123!' },
  { email: 'qa.novato@exemplo.com', password: 'QaNovato123!' },
];

for (const u of USERS) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const found = (list?.users || []).find(x => x.email?.toLowerCase() === u.email.toLowerCase());
  if (found) {
    console.log(`[users] ja existe ${u.email} -> ${found.id}`);
    continue;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
  if (error) {
    console.error(`[users] erro ao criar ${u.email}:`, error.message);
    continue;
  }
  console.log(`[users] criado ${u.email} -> ${data.user.id}`);
}