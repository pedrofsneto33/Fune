# HANDOFF — Fune (sessão 2026-09: auditoria de roles)

## 1. O projeto

- Nome/repo: Fune — `https://github.com/pedrofsneto33/Fune.git`; local: `C:\Users\User\eternitysos`.
- Stack: Next.js 16 + React 19 + TypeScript 5 + Supabase + Asaas + Jest + Vercel.
- Roles: `superadmin`, `admin`, `manager`, `financial`, `attendant`, `driver`.
- Regras do AGENTS.md/CLAUDE.md: responder pt-BR, respostas curtas, não ler arquivos >500 linhas inteiras, não carregar `graphify-out/`, uma ferramenta MCP por mensagem, não modificar `src/app/api/` sem autorização explícita.

## 2. Estilo dos prompts

- Bloco `=== REGRAS ===` / `=== FIM ===`; output literal em seções A/B/C.
- `SOMENTE LEITURA` quando auditoria; `NAO INVENTE`; autorização explícita quando editar; sempre commit isolado por unidade coerente.
- NÃO usar `\n` em commit no PowerShell — usar múltiplos `-m`.

## 3. Estado atual do repositório

- Branch main, sincronizada com origin/main, working tree limpo.
- Últimos commits relevantes desta fase:
  - `d23c25a` fix(security): fechar 3 acessos (fiscal/config, saas/subscription, lead-notes)
  - `3f6677b` fix(billing/collector): remover attendant do POST
  - `e1dcdc1` docs: HANDOFF pós-remoção das rotas órfãs
  - `bb66825` chore(billing): remover 4 rotas órfãs
  - `4b07c47` docs(billing): @deprecated nas órfãs
  - `7569c09` fix(billing/generate-cycles): resolve customer por CPF
- Testes: 24 suites / 253 tests passando.
- Build: compila; TSC exit 0.

## 4. O que foi feito (cronológico)

- (a) Fix do bug `customer: holder.cpf` em generate-cycles — passou a resolver customer no Asaas (GET `/customers?cpfCnpj=` + POST se ausente), removeu falha silenciosa, normalizou phone +55, sanitizou `full_name`, adicionou array `errors[]` no retorno. Commit `7569c09`.
- (b) Auditoria de consumidores das 4 rotas órfãs — 0 chamadores executáveis, 0 auth de máquina. Commit `4b07c47` marcou `@deprecated`. Commit `bb66825` DELETOU as 4 (`boleto`, `billing/pix`, `payments/pix`, `generate-cycles`) + 2 testes exclusivos + ajuste em `money-columns.test.ts`. Restaurável via `git revert bb66825` se produto confirmar uso externo.
- (c) Auditoria de roles restantes — matriz role × rota. Flags corrigidos:
  - CRÍTICO: `attendant` removido do POST de `billing/collector` (commit `3f6677b`).
  - `fiscal/config` PATCH: só superadmin+admin (era +manager+financial).
  - `saas/subscription` GET: superadmin + `requireGlobal` (igual irmãs saas/*).
  - `lead-notes`: comentário "tabela global, SA-only por design" (sem mudança funcional).
  - Commits: `3f6677b`, `d23c25a`.
- (d) Teste `saas-billing.test.ts` atualizado: caso 403 sem superadmin + 200 com superadmin.

## 5. Pendências

1. NENHUMA técnica. Working tree limpo, main == origin/main.
2. Avisar Pedro das remoções (routes órfãs) — texto: se houver cron externo chamando `/api/billing/generate-cycles` ou `/api/billing/boleto`, restaurar via `git checkout bb66825^ -- <path>` (não `revert`).
3. Flags ACEITÁVEIS da auditoria (sem ação): `tenants/GET` sem roles (só booleans, sem chaves), `tenants/logo` POST manager, `leads/landing` e `healthz` públicos por design.

## 6. Gotchas

- Repo ≠ workspace do chat, sempre caminho absoluto no `C:\Users\User\eternitysos`.
- pt-BR.
- `rg` no PowerShell com `; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }`.
- Não ler arquivos gigantes; não carregar `graphify-out/`.
- Mexer em `src/app/api/` exige autorização explícita no prompt.
- No Windows, multi-linha em commit é múltiplos `-m`, não `\n`.
- Ao adicionar rota nova seguir o padrão `withAuth([...], { requireGlobal? })` + filtro `tenant_id` + `checkRateLimit`.

