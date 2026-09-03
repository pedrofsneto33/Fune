// ============================================================
// Converte classes dark-only em dual (light + dark:)
// Transforma: bg-slate-950 -> bg-slate-50 dark:bg-slate-950
// Preserva classes ja com "dark:" (idempotente)
// Preserva text-white dentro de botoes coloridos (ex: bg-blue-600 text-white)
// ============================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Mapeamentos: [padrao, substituicao]
// Lookbehind (?<![\w:]) garante classe pura (ignora dark:/hover:/focus: precedentes)
const MAP = [
  [/(?<![\w:])bg-zinc-950/g, 'bg-slate-50 dark:bg-zinc-950'],
  [/(?<![\w:])bg-slate-950/g, 'bg-slate-50 dark:bg-slate-950'],
  [/(?<![\w:])bg-zinc-900/g, 'bg-white dark:bg-zinc-900'],
  [/(?<![\w:])bg-slate-900/g, 'bg-white dark:bg-slate-900'],
  [/(?<![\w:])bg-zinc-800/g, 'bg-slate-100 dark:bg-zinc-800'],
  [/(?<![\w:])bg-slate-800/g, 'bg-slate-200 dark:bg-slate-800'],
  [/(?<![\w:])bg-zinc-700/g, 'bg-slate-300 dark:bg-zinc-700'],
  [/(?<![\w:])bg-slate-700/g, 'bg-slate-300 dark:bg-slate-700'],
  [/(?<![\w:])text-zinc-100/g, 'text-zinc-900 dark:text-zinc-100'],
  [/(?<![\w:])text-zinc-200/g, 'text-zinc-800 dark:text-zinc-200'],
  [/(?<![\w:])text-zinc-300/g, 'text-zinc-700 dark:text-zinc-300'],
  [/(?<![\w:])text-slate-100/g, 'text-slate-900 dark:text-slate-100'],
  [/(?<![\w:])text-slate-200/g, 'text-slate-700 dark:text-slate-200'],
  [/(?<![\w:])text-slate-300/g, 'text-slate-600 dark:text-slate-300'],
  [/(?<![\w:])text-white/g, 'text-slate-900 dark:text-white'],
  [/(?<![\w:])text-slate-400/g, 'text-slate-500 dark:text-slate-400'],
  [/(?<![\w:])text-slate-500/g, 'text-slate-600 dark:text-slate-500'],
  [/(?<![\w:])border-zinc-800/g, 'border-zinc-200 dark:border-zinc-800'],
  [/(?<![\w:])border-slate-800/g, 'border-slate-200 dark:border-slate-800'],
  [/(?<![\w:])border-zinc-700/g, 'border-zinc-200 dark:border-zinc-700'],
  [/(?<![\w:])border-slate-700/g, 'border-slate-300 dark:border-slate-700'],
  [/(?<![\w:])placeholder-slate-500/g, 'placeholder-slate-400 dark:placeholder-slate-500'],
  [/(?<![\w:])hover:bg-slate-800/g, 'hover:bg-slate-200 dark:hover:bg-slate-800'],
  [/(?<![\w:])hover:bg-slate-700/g, 'hover:bg-slate-300 dark:hover:bg-slate-700'],
  [/(?<![\w:])hover:bg-zinc-800/g, 'hover:bg-zinc-200 dark:hover:bg-zinc-800'],
];

// Depois de converter text-white -> text-slate-900 dark:text-white,
// reverter para text-white dentro de elementos com fundo colorido (botoes)
function restoreColoredButtons(text) {
  const colorRe = '(?:bg|hover:bg|focus:bg|from|via|to)-(?:blue|emerald|rose|amber|purple|cyan|green|red|indigo|violet|teal|orange|pink|sky|fuchsia|yellow|lime)-[0-9]{2,3}';
  const re = new RegExp('(' + colorRe + ')([^"`]{0,200}?)text-slate-900 dark:text-white', 'g');
  return text.replace(re, (match, p1, p2) => {
    // Garante que dentro deste trecho nao haja outra troca que quebre
    return p1 + p2 + 'text-white dark:text-white';
  });
}

// --- Arquivos a processar ---
function collectFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      out.push(...collectFiles(full));
    } else if (/\.(tsx|ts|css)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = [
  ...collectFiles(path.join(ROOT, 'src')),
];

let touched = 0;
for (const file of files) {
  // Pula diretorios que nao devem ser tocados
  if (/node_modules/.test(file)) continue;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  let original = content;

  for (const [re, repl] of MAP) {
    content = content.replace(re, repl);
  }
  content = restoreColoredButtons(content);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    touched++;
    console.log('MODIFICADO:', path.relative(ROOT, file));
  }
}
console.log('Total de arquivos alterados:', touched);