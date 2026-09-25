# HANDOFF — Fune (pós-limpeza de fundação)

## 1. O projeto

- Nome: eternitysos; repo local `C:\Users\User\eternitysos` (GitHub: `https://github.com/pedrofsneto33/Fune.git`).
- Stack: Next.js 16 + React 19 + Supabase + Asaas + Jest + Vercel.
- Roles: `superadmin`, `admin`, `manager`, `financial`, `attendant`, `driver`.
- Regras AGENTS.md/CLAUDE.md: responder pt-BR, respostas curtas, não ler arquivos >500 linhas inteiras, não carregar `graphify-out/`, uma ferramenta MCP por mensagem, não modificar `src/app/api/` sem autorização explícita.

## 2. Estilo dos prompts

- Bloco `=== REGRAS ===` / `=== FIM ===`; output literal em seções A/B/C/D.
- `SOMENTE LEITURA` quando auditoria; `NAO INVENTE`; autorização explícita quando editar; commit isolado por unidade coerente.
- No PowerShell usar múltiplos `-m` (NÃO `\n`) e `; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }` pra `rg` sem match.

## 3. Estado atual do repositório

- branch main == origin/main, working tree limpo, HEAD `d705c6c`.
- 10 commits nesta fase (`7569c09` -> `d705c6c`):
  - `d705c6c` chore: limpeza de fundação (AGENTS.md + api-handler.ts)
  - `d23c25a` fix(security): fechar 3 acessos (fiscal/config, saas/subscription, lead-notes)
  - `3f6677b` fix(billing/collector): remover attendant do POST
  - `4aa9553` docs: HANDOFF pós-auditoria de roles
  - `e1dcdc1` docs: HANDOFF pós-remoção das rotas órfãs
  - `bb66825` chore(billing): remover 4 rotas órfãs
  - `4b07c47` docs(billing): @deprecated nas órfãs
  - `7569c09` fix(billing/generate-cycles): resolve customer por CPF
- testes: 24 suites / 253 testes passando
- build: compila; TSC exit 0; ESLint src/: 163 erros + 50 warnings (era 165)

## 4. O que foi feito nesta fase (cronológico, resumido)

- (a) Fix bug customer: holder.cpf em generate-cycles — resolver customer via GET `/customers?cpfCnpj=` + POST se ausente, removeu falha silenciosa, phone +55, sanitizeString em `full_name`, `errors[]` no retorno. `7569c09`.
- (b) Auditoria de consumidores das 4 rotas órfãs — 0 chamadores, 0 auth de máquina. `4b07c47` marcou @deprecated. `bb66825` DELETOU as 4 (`boleto`, `billing/pix`, `payments/pix`, `generate-cycles`) + 2 testes exclusivos + ajuste em `money-columns.test.ts`. Restaurável via `git revert bb66825` ou `git checkout bb66825^ -- <path>`.
- (c) Auditoria de roles: 3 flags corrigidos em `d23c25a` (fiscal/config PATCH só superadmin+admin; saas/subscription GET superadmin+requireGlobal; lead-notes comentário). `3f6677b` removeu attendant do POST de billing/collector (CRÍTICO). Teste saas-billing atualizado (403 sem SA).
- (d) Limpeza de fundação `d705c6c`: AGENTS.md "bugs conhecidos" reescrito (só 2 reais: vehicles×fleet_vehicles duplicada; deceased_id obrigatório p/ free); api-handler.ts 2 any -> `Record<string, string | string[]>`.
- (e) Verificação independente 2026-09 do review externo (Claude): 165 erros ESLint, coverage eligibility.ts 32.43%, validation.ts 39.06%, 4/6 bugs do AGENTS.md desatualizados — TODAS confirmadas.

## 5. Pendências

1. NENHUMA técnica. Working tree limpo, main == origin/main.
2. AVISAR PEDRO: 4 rotas órfãs removidas. Se houver cron externo chamando `/api/billing/generate-cycles` ou `/api/billing/boleto`, restaurar via `git checkout bb66825^ -- <path>`.
3. PRÓXIMO ALVO (nova sessão): coverage de eligibility.ts (32%) e validation.ts (39%) — são "fonte única de verdade" do sistema com pior cobertura. Só adiciona teste, zero mudança de runtime.
4. Dívida arquitetural (ticket separado): `ctx.params` no withAuth é peso morto (106 chamadas, nenhuma usa); 126 anys restantes; 32 warnings react-hooks/set-state-in-effect.
5. Decisão de produto: remover tabela órfã `fleet_vehicles` (0 usos runtime).

## 6. Gotchas

- Repo ≠ workspace do chat; sempre caminho absoluto `C:\Users\User\eternitysos`; pt-BR.
- No PowerShell usar `; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }`.
- Não ler arquivos gigantes; não carregar `graphify-out/`.
- Mexer em `src/app/api/` exige autorização explícita.
- Múltiplos `-m` em commit, NÃO `\n`.
- `tsc` exige recriar `next-env.d.ts` se gitignore limpar.
- Ao adicionar rota nova seguir `withAuth([...], { requireGlobal? })` + filtro `tenant_id` + `checkRateLimit`.
