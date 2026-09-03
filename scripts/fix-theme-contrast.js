// ============================================================
// Correcao ESTATICA de contraste no theme claro em botoes coloridos.
// Para cada className com bg forte (bg-*-500/600/700/800):
//  - "text-slate-900 dark:text-white" -> "text-white"   (ja tinha white no dark; no light precisa ser white)
//  - "text-slate-X" sozinho            -> "text-white dark:text-white"
//  - sem text-white algum              -> acrescenta " text-white dark:text-white"
// ============================================================
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const COLOR = '(?:blue|emerald|rose|amber|violet|sky|teal|orange|red|indigo|yellow|lime|pink|green|fuchsia)';
const STRONG = new RegExp('(?<![\\w:])bg-' + COLOR + '-(?:500|600|700|800)');

function walk(d) {
  let out = [];
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) out = out.concat(walk(f));
    else if (/\.(tsx|ts|jsx)$/.test(e.name)) out.push(f);
  }
  return out;
}

const files = [
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/app/landing/page.tsx',
  'src/components/AuthGuard.tsx',
].concat(walk(path.join(ROOT, 'src/components/modals')))
  .concat(walk(path.join(ROOT, 'src/components/dashboard')));

let touched = 0;
for (const rel of files) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
  let changed = false;
  const out = lines.map((line) => {
    if (!STRONG.test(line)) return line;
    STRONG.lastIndex = 0;
    let l = line;
    // bg forte + "text-slate-X dark:text-white" -> "text-white"
    if (/text-slate-\d+\s*dark:text-white/.test(l)) {
      l = l.replace(/text-slate-\d+\s*dark:text-white/g, 'text-white');
    }
    // bg forte + text-slate-X SEM dark -> "text-white dark:text-white"
    if (/dark:text-white/.test(l) === false && /text-slate-\d+(?![-\w])/.test(l)) {
      l = l.replace(/text-slate-\d+(?![-\w])/g, 'text-white dark:text-white');
    }
    // bg forte sem text-white -> acrescenta
    if (!/text-white\b/.test(l) && /className=/.test(l)) {
      l = l.replace(/(className="[^"]*")$/, (m) => m.replace(/"$/, ' text-white dark:text-white"'));
    }
    if (l !== line) changed = true;
    return l;
  });
  if (changed) {
    fs.writeFileSync(full, out.join('\n'), 'utf8');
    touched++;
    console.log('FIX:', rel);
  }
}
console.log('Total arquivos corrigidos:', touched);
