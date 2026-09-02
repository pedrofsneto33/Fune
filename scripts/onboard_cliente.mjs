// ONBOARDING DE NOVO CLIENTE — "Duplica" o software para uma nova funerária
// Uso: node scripts/novo_cliente.mjs "Nome Empresa" "00.000.000/0001-00" "dono@cliente.com"
//
// O que faz (idempotente):
//  1. Verifica se o e-mail já tem conta no auth.
//  2. Cria um NOVO tenant para o cliente (status active).
//  3. Cria um plano associativo padrão "Familiar" para esse tenant.
//  4. Vincula o dono informado como ADMIN do novo tenant.
//  5. (opcional) Se o e-mail não tiver conta, apenas imprime o SQL de retry.
//
// Depois de rodar: o dono faz login e o sistema já estará "duplicado" para ele.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ---- lê .env.local ----
const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

function nf(n) { return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const [name, cnpj, ownerEmail] = process.argv.slice(2);
if (!name || !cnpj || !ownerEmail) {
  console.log('Uso: node scripts/novo_cliente.mjs "Nome Empresa" "00.000.000/0001-00" "dono@cliente.com"');
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ---- 1. verifica dono no auth ----
const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const owner = (users?.users || []).find(u => u.email?.toLowerCase() === ownerEmail.toLowerCase());

if (!owner) {
  console.warn(`\n[DONO] e-mail "${ownerEmail}" AINDA NÃO tem conta no auth.`);
  console.warn(`Para terminar: crie a conta no sistema e rode novamente com o mesmo e-mail.\n`);
}

// ---- 2. cria tenant (idempotente por CNPJ) ----
const { data: existingTenant } = await supabase
  .from('tenants')
  .select('id, name, cnpj')
  .eq('cnpj', cnpj)
  .maybeSingle();

let tenantId;
if (existingTenant) {
  console.log(`[TENANT] já existia: ${existingTenant.name} (${existingTenant.cnpj}) – id ${existingTenant.id}`);
  tenantId = existingTenant.id;
} else {
  const { data: ten, error: tenErr } = await supabase
    .from('tenants')
    .insert({
      name,
      trade_name: name,
      cnpj,
      status: 'active',
      commercial_plan: 'essencial',
    })
    .select('id, name')
    .single();
  if (tenErr) {
    console.error('[TENANT] erro ao criar:', tenErr.message);
    process.exit(1);
  }
  tenantId = ten.id;
  console.log(`[TENANT] criado: ${ten.name} (id ${tenantId})`);
}

// ---- 3. plano associativo padrão (Familiar) ----
const { data: existingPlan } = await supabase
  .from('plans')
  .select('id, name')
  .eq('tenant_id', tenantId)
  .limit(1)
  .maybeSingle();

if (existingPlan) {
  console.log(`[PLANO] já existia: ${existingPlan.name}`);
} else {
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .insert({ tenant_id: tenantId, name: 'Familiar', monthly_fee: 69.9, max_dependents: 4 })
    .select('id, name')
    .single();
  if (planErr) {
    console.error('[PLANO] erro ao criar:', planErr.message);
    process.exit(1);
  }
  console.log(`[PLANO] criado: ${plan.name} (mensalidade ${nf(69.9)})`);
}

// ---- 4. vincula dono como ADMIN (se tiver conta) ----
if (owner) {
  const { data: role, error: roleErr } = await supabase
    .from('user_roles')
    .upsert({ user_id: owner.id, tenant_id: tenantId, role: 'admin' }, { onConflict: 'user_id,tenant_id' })
    .select('id, role')
    .single();
  if (roleErr) {
    console.error('[ADMIN] erro ao vincular:', roleErr.message);
    process.exit(1);
  }
  console.log(`[ADMIN] ${owner.email} vinculado como ${role.role} no tenant ${name}`);
} else {
  console.warn(`[ADMIN] pulando vínculo (dono ainda sem conta).`);
}

console.log('\n✅ Onboarding do cliente "' + name + '" concluído.');
console.log('Próximo passo: o dono cria a conta e o sistema estará pronto para ele operar.');