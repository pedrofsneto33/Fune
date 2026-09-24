# HANDOFF — sessão de auditoria billing (2026-09-24)

## 1. O projeto
- Nome/repo: Fune — `https://github.com/pedrofsneto33/Fune.git` (local: `C:\Users\User\eternitysos`).
- Stack: Next.js 16 (App Router) + React 19 + TypeScript 5 + Supabase + Asaas (fetch direto) + Jest; deploy na Vercel.
- Arquitetura-chave: rotas em `src/app/api/**` com `withAuth(handler, [roles])` + filtro `tenant_id` sempre; Asaas por tenant (`getAsaasConfigForTenant`); conciliação via webhook Asaas (`asaas_payment_id`); regra única de elegibilidade em `src/lib/eligibility.ts`.
- Rotas de billing: `asaas-batch`, `avulso`, `boleto`, `collector`, `generate-cycles`, `pix`; payments: `pix`.
- Regras do AGENTS.md: responder em pt-BR; não ler arquivos >500 linhas inteiros; não mexer em `src/app/api/` sem autorização explícita; uma ferramenta MCP por mensagem; não carregar `graphify-out/`.

## 2. Estilo dos prompts
- Bloco `=== REGRAS ===` … `=== FIM ===` com passos numerados e saída em seções fixas (A/B/C/D).
- Output literal nas seções, sem narrar.
- `SOMENTE LEITURA` quando for auditoria; `NAO INVENTE` (só o que está no código/doc); autorização explícita e limitada (arquivos exatos) quando for editar/commitar/push.

## 3. Estado atual do repositório
- Branch: `main`, sincronizada com `origin/main` (`## main...origin/main`, sem ahead/behind).
- Últimos commits relevantes: `4b07c47` (docs: @deprecated nas órfãs + nota GRAPHIFY.md), `7569c09` (fix generate-cycles: customer por CPF).
- Testes: 26 suites / 275 tests passando (última execução nesta sessão).
- Build: `next build` compila (executado nesta sessão antes do fix final).
- Working tree: limpo (nenhum arquivo modificado).

## 4. O que foi feito nesta sessão
- (a) Fix do bug `customer: holder.cpf` em `src/app/api/billing/generate-cycles/route.ts` — agora faz GET `/customers?cpfCnpj=` + POST `/customers` antes de cobrar; falha silenciosa eliminada (recusa do Asaas → `errors[]` + sem insert); phone normalizado `+55`; `full_name` sanitizado; array `errors[]` no retorno. Commit `7569c09`.
- (b) Auditoria de consumidores das 4 rotas de billing (`boleto`, `billing/pix`, `generate-cycles`, `payments/pix`) — 0 consumidores executáveis (só testes/docs/artefatos graphify); sem auth de máquina (só `withAuth` JWT; `access_token` é saída p/ Asaas). Resultado: PRECISA CONFIRMAR COM PRODUTO.
- (c) Matriz de redundância entre as 3 "internas" e as ativas:
  - `billing/boleto` → MANTER (única rota que emite boleto de contrato com gravação em `payments` + reconciliação webhook; `avulso` não cobre).
  - `billing/pix` × `payments/pix` → FUSIONAR (duplicam emissão PIX; unificar gravação local + rate-limit — refactor, não cleanup).
  - `generate-cycles` → DELETAR (0 chamadores; só HTTP externo/manual; docs descrevem cron inexistente).
- (d) Marcação `@deprecated` (só JSDoc) em `boleto`, `billing/pix`, `payments/pix`, `generate-cycles` + nota em `docs/GRAPHIFY.md` (fora do bloco mermaid). Commit `4b07c47`. Nenhuma linha executável alterada além do fix (a). Ambos os commits já foram pushados para `origin/main`.

## 5. Pendências (em ordem de prioridade)
1. DECISÃO DE PRODUTO: deletar × manter as 4 rotas órfãs. Único bloqueio.
2. Se deletar: remover também os testes que importam os handlers (`tests/routes/billing-pix.test.ts`, `tests/routes/payments-pix.test.ts`, `tests/routes/money-columns.test.ts`) — senão a suíte quebra.
3. Ticket separado: fusão `billing/pix` × `payments/pix` (2 arquivos de teste + reconciliação webhook — NÃO é cleanup).
4. Se o produto confirmar cron externo para `generate-cycles`: manter e remover a marcação `@deprecated`.

## 6. Gotchas
- Repo ≠ workspace de chat: repo é `C:\Users\User\eternitysos`; workspace chat é `C:\Users\User\.cline\data\workspaces\chat` — sempre usar caminhos absolutos.
- Responder em pt-BR.
- `rg` no PowerShell: anexar `; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }` para distinguir "sem match" de erro.
- Não ler arquivos >500 linhas inteiros; não carregar `graphify-out/`.
- Próximo passo de decisão exige autorização explícita porque toca `src/app/api/`.
