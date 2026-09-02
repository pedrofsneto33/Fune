/**
 * TESTE DE ISOLAMENTO PÓS-FIX
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '..', '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  } catch {}
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) { console.log('❌ ENV missing'); process.exit(1); }

async function check(tabela) {
  const supabase = createClient(URL, KEY);
  const { data, error } = await supabase.from(tabela).select('*').limit(5);
  if (error) {
    if (error.code === '42501') return { tabela, ok: true, msg: 'RLS bloqueando' };
    return { tabela, ok: null, msg: error.message };
  }
  if (data?.length > 0) return { tabela, ok: false, msg: `${data.length} registros vazados` };
  return { tabela, ok: true, msg: 'Sem dados' };
}

async function main() {
  console.log('🚀 TESTE ISOLAMENTO PÓS-FIX\n');
  const tabelas = ['vehicles','chapel_burials','financial_transactions','dependents','contracts','payments','inventory','fleet_vehicles','burial_records'];
  let protegidos = 0, vazados = 0;
  for (const t of tabelas) {
    const r = await check(t);
    console.log(`${r.ok ? '✅' : r.ok === false ? '❌' : '⚠️'} ${t}: ${r.msg}`);
    if (r.ok) protegidos++;
    else if (r.ok === false) vazados++;
  }
  console.log(`\n✅ Protegidos: ${protegidos} | ❌ Vazados: ${vazados}`);
  if (vazados > 0) { process.exit(1); }
  console.log('\n✅ ISOLAMENTO OK');
}
main();