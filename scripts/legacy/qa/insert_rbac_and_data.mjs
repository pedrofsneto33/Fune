// QA - insere RBAC de teste + dados de isolamento (idempotente)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function userId(email) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const u = (list?.users || []).find(x => x.email?.toLowerCase() === email.toLowerCase());
  return u?.id;
}

const TENANT_TESTE_CNPJ = '12.345.678/0001-90';
const TENANT_ISO_CNPJ = '98.765.432/0001-01';

// 1. Garante tenant de teste (criado pelo onboard) e tenant de isolamento
const { data: tenTeste } = await supabase
  .from('tenants')
  .select('id, name')
  .eq('cnpj', TENANT_TESTE_CNPJ)
  .maybeSingle();
if (!tenTeste) {
  console.error('[qa] tenant de teste nao encontrado. Rode o onboard_cliente.mjs primeiro.');
  process.exit(1);
}

const { data: tenIso } = await supabase
  .from('tenants')
  .select('id, name')
  .eq('cnpj', TENANT_ISO_CNPJ)
  .maybeSingle();

let isoId;
if (tenIso) {
  isoId = tenIso.id;
  console.log(`[qa] tenant iso ja existia: ${tenIso.name}`);
} else {
  const { data, error } = await supabase
    .from('tenants')
    .insert({ name: 'QA Isolamento', trade_name: 'QA Isolamento', cnpj: TENANT_ISO_CNPJ, status: 'active', commercial_plan: 'profissional' })
    .select('id')
    .single();
  if (error) { console.error('[qa] erro ao criar tenant iso:', error.message); process.exit(1); }
  isoId = data.id;
  console.log(`[qa] tenant iso criado: ${data.id}`);
}

// 2. Vincula qa.super como superadmin no tenant de teste
const superId = await userId('qa.super@exemplo.com');
if (!superId) { console.error('[qa] qa.super nao existe'); process.exit(1); }
const { error: errSuper } = await supabase
  .from('user_roles')
  .upsert({ user_id: superId, tenant_id: tenTeste.id, role: 'superadmin' }, { onConflict: 'user_id,tenant_id' });
if (errSuper) { console.error('[qa] erro ao vincular qa.super:', errSuper.message); process.exit(1); }
console.log('[qa] qa.super vinculado como superadmin no tenant de teste');

// 3. Cria dados ficticios para testar isolamento
// 2 holders no tenant de teste
const cpfA = '11122233344';
const cpfB = '55566677788';
const { count: holdCount } = await supabase
  .from('holders')
  .select('*', { count: 'exact', head: true })
  .eq('tenant_id', tenTeste.id);
if ((holdCount || 0) < 2) {
  await supabase.from('holders').upsert([
    { tenant_id: tenTeste.id, full_name: 'QA Holder Um', cpf: cpfA, phone: '11911110000' },
    { tenant_id: tenTeste.id, full_name: 'QA Holder Dois', cpf: cpfB, phone: '11922220000' },
  ], { onConflict: 'tenant_id,cpf' });
  console.log('[qa] holders de teste criados no tenant de teste');
} else {
  console.log('[qa] holders de teste ja existiam');
}

// 1 holder NO OUTRO tenant (nao deve ser visivel para o admin do tenant de teste)
const { count: isoCount } = await supabase
  .from('holders')
  .select('*', { count: 'exact', head: true })
  .eq('tenant_id', isoId);
if (!isoCount) {
  await supabase.from('holders').insert([
    { tenant_id: isoId, full_name: 'QA Holder Forasteiro', cpf: '99988877766', phone: '11933330000' },
  ]);
  console.log('[qa] holder forasteiro criado no tenant iso');
} else {
  console.log('[qa] holder forasteiro ja existia');
}

const { data: forasteiro } = await supabase
  .from('holders')
  .select('id')
  .eq('tenant_id', isoId)
  .limit(1)
  .single();
console.log(`[qa] tenant_teste.id=${tenTeste.id}`);
console.log(`[qa] tenant_iso.id=${isoId}`);
console.log(`[qa] holder_forasteiro.id=${forasteiro?.id}`);
console.log('[qa] setup concluido');