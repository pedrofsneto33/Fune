# HANDOFF — pós-remoção das rotas órfãs (2026-09-24)

## 1. O projeto
- Nome/repo: Fune — `https://github.com/pedrofsneto33/Fune.git`; local: `C:\Users\User\eternitysos`.
- Stack: Next.js 16 + React 19 + TypeScript 5 + Supabase + Asaas + Jest + Vercel.
- Regras do AGENTS.md/CLAUDE.md: responder pt-BR, respostas curtas, não ler arquivos >500 linhas inteiras, não carregar `graphify-out/`, uma ferramenta MCP por mensagem, não modificar `src/app/api/` sem autorização explícita.

## 2. Estilo dos prompts
- Bloco `=== REGRAS ===` / `=== FIM ===`; output literal em seções A/B/C.
- `SOMENTE LEITURA` quando auditoria; `NAO INVENTE`; autorização explícita quando editar; sempre pedir commit isolado por unidade coerente.

## 3. Estado atual do repositório
- Branch main, sincronizada com origin/main.
- Últimos commits relevantes: `bb66825` (remoção das 4 órfãs), `29ebc6a` (HANDOFF.md), `4b07c47` (@deprecated), `7569c09` (fix generate-cycles).
- Testes: 24 suites / 252 tests passando (caiu de 26/275 porque 2 arquivos de teste foram removidos junto com as rotas).
- Working tree limpo.

## 4. O que foi feito nesta sessão (em ordem)
- (a) Fix do bug `customer: holder.cpf` em generate-cycles — passou a resolver customer no Asaas (GET `/customers?cpfCnpj=` + POST se ausente), removeu falha silenciosa, normalizou phone +55, sanitizou `full_name`, adicionou array `errors[]` no retorno. Commit `7569c09`.
- (b) Auditoria de consumidores: 0 chamadores executáveis, 0 auth de máquina nas 4 rotas. Veredito inicial: PRECISA CONFIRMAR COM PRODUTO.
- (c) Matriz de redundância: boleto → MANTER (se fosse manter algo); billing/pix × payments/pix → duplicatas; generate-cycles → 0 chamadores.
- (d) Marcação `@deprecated` nas 4 + nota em `docs/GRAPHIFY.md`. Commit `4b07c47`.
- (e) DELETADAS as 4 rotas + 2 arquivos de teste exclusivos; ajustado `tests/routes/money-columns.test.ts` (3 `it` removidos). Commit `bb66825`. Histórico preservado: restaurável via `git revert bb66825` se o produto confirmar uso externo (ex.: cron chamando generate-cycles).

## 5. Pendências
1. NENHUMA técnica. Working tree limpo, main == origin/main.
2. Avisar stakeholder (Pedro) da remoção — texto sugerido: 4 rotas órfãs removidas após auditoria; se algum cron/integração externa chamar /api/billing/generate-cycles ou /api/billing/boleto, avisar para restaurar via git revert bb66825.
3. Se houver restauração: preferir restaurar SÓ generate-cycles (`git checkout bb66825^ -- src/app/api/billing/generate-cycles/`) e manter as outras 3 deletadas.

## 6. Gotchas
- Repo ≠ workspace do chat, sempre caminho absoluto no `C:\Users\User\eternitysos`.
- pt-BR.
- `rg` no PowerShell com `; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }`.
- Não ler arquivos gigantes; não carregar `graphify-out/`.
- Mexer em `src/app/api/` exige autorização explícita no prompt.
- Ao adicionar rota nova seguir o padrão `withAuth([...])` + filtro `tenant_id` + `checkRateLimit`.
