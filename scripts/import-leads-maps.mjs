import { readFileSync } from 'node:fs';

const CSV_PATH = 'C:\\Users\\User\\Downloads\\google.csv';
const COMMIT = process.argv.includes('--commit');

function parseLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function loadEnv() {
  const env = {};
  try {
    const txt = readFileSync('.env.local', 'utf8');
    for (const l of txt.split('\n')) {
      const m = l.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
  return env;
}

const raw = readFileSync(CSV_PATH, 'utf8').split(/\r?\n/);
const rows = raw.slice(3).filter((l) => l.trim() !== '').map(parseLine);

const leads = [];
for (const cols of rows) {
  let name = (cols[1] || '').trim();
  if (name.startsWith('http')) {
    name = cols.slice(1).find((c) => c && !c.startsWith('http'))?.trim() || '';
  }
  if (!name) continue;
  const rating = (cols[2] || '').replace(',', '.').trim();
  const reviews = (cols[3] || '').replace(/[()]/g, '').trim();
  const phone = (cols[9] || '').trim();
  const website = (cols[10] || '').trim().startsWith('http') ? cols[10].trim() : '';
  let address = '';
  for (const idx of [6, 7, 8]) {
    const c = (cols[idx] || '').trim();
    if (c && c !== '·' && !/aberto/i.test(c)) { address = c; break; }
  }
  if (!address) {
    const cand = cols.slice(4, 12).find((c) => c && /av\.?|rua|r\.|avenida|nº|^\d{2,}/i.test(c));
    if (cand) address = cand.trim();
  }
  const parts = [];
  if (rating) parts.push(`Rating: ${rating}`);
  if (reviews) parts.push(`Reviews: ${reviews}`);
  if (address) parts.push(`Endereco: ${address}`);
  if (website && !/google\.com\/aclk|googleadservices|gclid=/i.test(website)) parts.push(`Site: ${website}`);
  leads.push({
    name,
    phone: phone || null,
    city: 'Teresina',
    uf: 'PI',
    source: 'outbound',
    stage: 'novo',
    estimated_monthly: 0,
    notes: parts.join(' | ') || null,
  });
}

const seen = new Set();
let dups = 0;
const unique = leads.filter((l) => {
  const k = l.phone || l.name.toLowerCase().trim();
  if (seen.has(k)) { dups++; return false; }
  seen.add(k);
  return true;
});
leads.length = 0;
leads.push(...unique);

if (!COMMIT) {
  console.log('DRY RUN — nada sera inserido. Passe --commit para inserir.');
  console.log(JSON.stringify(leads.slice(0, 5), null, 2));
  console.log(`Total: ${leads.length} leads`);
  console.log(`Removidos por duplicata: ${dups}`);
  process.exit(0);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('ENV ausente'); process.exit(1); }
console.log(JSON.stringify(leads.slice(0, 3), null, 2));
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await sb.from('leads').insert(leads).select('id');
if (error) { console.error('INSERT ERRO:', error.message); process.exit(1); }
console.log(`Inseridos: ${data.length}`);
