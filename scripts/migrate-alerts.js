/**
 * Migra alert("...") / alert(`...`) para notifySuccess/Error/Info (sonner).
 * Classifica pelo conteudo: ✓ ou "sucesso" -> success; "Erro/Falha/..." -> error; resto -> info.
 * Insere o import de @/lib/notify nos arquivos alterados.
 * Uso: node scripts/migrate-alerts.js <arquivo1> <arquivo2> ...
 */
const fs = require('fs');

const files = process.argv.slice(2);
let totalBefore = 0;
let totalAfter = 0;

for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const before = (t.match(/\balert\(/g) || []).length;
  if (before === 0) {
    console.log(f + ': 0 alerts (skip)');
    continue;
  }

  t = t.replace(/\balert\(\s*(`|'|")([\s\S]*?)\1\s*\)/g, (m, q, body) => {
    const b = body.trim();
    const firstLine = b.split('\n')[0];
    const fn =
      b.startsWith('✓') || /sucesso/i.test(firstLine)
        ? 'notifySuccess'
        : /^(erro|falha|aten|n[aã]o foi)/i.test(firstLine) || /inv[aá]lid/i.test(firstLine)
          ? 'notifyError'
          : 'notifyInfo';
    return fn + '(' + q + body + q + ')';
  });

  const after = (t.match(/\balert\(/g) || []).length;
  totalBefore += before;
  totalAfter += after;

  if (after < before && !/from ['"]@\/lib\/notify['"]/.test(t)) {
    if (/^['"]use client['"];/.test(t)) {
      t = t.replace(
        /^(['"]use client['"];\s*\n)/,
        "$1\nimport { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';\n",
      );
    } else {
      t = t.replace(
        /^(\s*import\b)/m,
        "import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';\n$1",
      );
    }
  }

  fs.writeFileSync(f, t, 'utf8');
  console.log(f + ': ' + before + ' -> ' + after + ' alerts restantes');
}

console.log('TOTAL: ' + totalBefore + ' -> ' + totalAfter);