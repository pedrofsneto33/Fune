import fs from 'node:fs';
const files = [
  ['termos', 'TERMOS-DE-USO'],
  ['privacidade', 'POLITICA-DE-PRIVACIDADE'],
  ['cookies', 'AVISO-DE-COOKIES'],
];
for (const [name, src] of files) {
  const md = fs
    .readFileSync(`docs/legal/${src}.md`, 'utf8')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  const out = `// Conteudo exportado de docs/legal/${src}.md (fonte da verdade).\n// Gerado automaticamente por scripts/gen-legal-content.mjs (escape de crases e dollar-chave aplicado).\nexport const conteudo = \`${md}\`;\n`;
  fs.writeFileSync(`src/content/legal/${name}.ts`, out);
  console.log(name, fs.statSync(`src/content/legal/${name}.ts`).size);
}