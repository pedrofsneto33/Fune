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

- branch main == origin/main, working tree limpo, HEAD `07fef83`.
- 38 commits desde `7569c09` (`7569c09` -> `07fef83`):
  - `07fef83` perf(db): indices compostos (tenant_id, created_at DESC) em holders + service_orders
  - `32ff194` perf(service-orders): GET read-only + tracking_token via DEFAULT
  - `4e22c0b` docs: HANDOFF pos-rodada 2026-10-01 (URLs + landing + riscos auditados)
  - `9e82a97` fix(tenant-settings): webhookUrl do Asaas usa resolvePublicBaseUrl()
  - `e0c8fd7` fix(landing): encolher video demo + copy honesta
  - `d3b624d` feat(landing): video demo na secao 'Veja o sistema por dentro'
  - `d3d31e4` chore(scripts): video-short nova sequencia + fix scroll + scrollTarget modal RBAC
  - `96862f9` feat(carteirinha): clicar abre em nova aba + botao copiar secundario
  - `109b3cd` fix(carteirinha): link publico usa origem real do navegador em producao
  - `42dffee` chore(scripts): automacao Playwright de screenshots do sistema
  - `445a2c8` feat(landing): secao 'Veja por dentro' com prints reais do sistema
  - `d63b3c1` fix(executivo): pluralizacao do KPI de frota
  - `dee65f7` feat(landing): botao Entrar no header
  - `cab5522` fix(dashboard/layout): tratar 401 como deslogado
  - `0eb9ee0` chore: alinhar comentario do matcher + logar falha de sessao
  - `537b8fe` fix: / principal redireciona para /landing
  - `2a3d614` chore(landing): finaliza publica estatica
  - `d04cba8` fix(landing): restaura CNPJ real
  - `4c20c8c` feat(landing): copy honesta OPÇÃO 1 CPF + prova nacional
  - `5f35c12` feat(landing): publica estatica, sem auth, proxy matcher
  - `bf3caf1` fix: P0 CSP nonce + carteirinha token + multi-tenant
  - `af78ac8` docs: HANDOFF pos-rodada 2026-09-27
  - `e5b12a6` chore: remover 5 exports dead (verificados por rg)
  - `d342d88` docs: corrigir descricao de fleet_vehicles + registrar riscos aceitos
  - `16a77ad` docs: atualizar HANDOFF.md pos-cobertura de api-handler
  - `2305a21` test(api-handler): cobrir 10 branches em falta (auth/authz)
  - `2bef56a` docs: atualizar HANDOFF.md pós-ciclo lib/
  - `dc2be44` chore(lib): remover regex órfãos + cobrir isWithinGracePeriod
  - `358c811` chore(lib): remover código morto em eligibility.ts e validation.ts
  - `76c951f` docs: atualizar HANDOFF.md pós-limpeza de fundação
  - `d705c6c` chore: limpeza de fundação (AGENTS.md + api-handler.ts)
  - `d23c25a` fix(security): fechar 3 acessos (fiscal/config, saas/subscription, lead-notes)
  - `3f6677b` fix(billing/collector): remover attendant do POST
  - `4aa9553` docs: HANDOFF pós-auditoria de roles
  - `e1dcdc1` docs: HANDOFF pós-remoção das rotas órfãs
  - `bb66825` chore(billing): remover 4 rotas órfãs
  - `4b07c47` docs(billing): @deprecated nas órfãs
  - `7569c09` fix(billing/generate-cycles): resolve customer por CPF
- testes: 24 suites / 267 testes passando
- coverage: eligibility.ts 100% | validation.ts ~70% (era 32% e 39%) | api-handler.ts 100% stmt/branch/func/line
- build: compila; TSC exit 0; ESLint src/: 156 erros + 49 warnings (era 163/50)

## 4. O que foi feito nesta fase (cronológico, resumido)

- (a) Fix bug customer: holder.cpf em generate-cycles — resolver customer via GET `/customers?cpfCnpj=` + POST se ausente, removeu falha silenciosa, phone +55, sanitizeString em `full_name`, `errors[]` no retorno. `7569c09`.
- (b) Auditoria de consumidores das 4 rotas órfãs — 0 chamadores, 0 auth de máquina. `4b07c47` marcou @deprecated. `bb66825` DELETOU as 4 (`boleto`, `billing/pix`, `payments/pix`, `generate-cycles`) + 2 testes exclusivos + ajuste em `money-columns.test.ts`. Restaurável via `git revert bb66825` ou `git checkout bb66825^ -- <path>`.
- (c) Auditoria de roles: 3 flags corrigidos em `d23c25a` (fiscal/config PATCH só superadmin+admin; saas/subscription GET superadmin+requireGlobal; lead-notes comentário). `3f6677b` removeu attendant do POST de billing/collector (CRÍTICO). Teste saas-billing atualizado (403 sem SA).
- (d) Limpeza de fundação `d705c6c`: AGENTS.md "bugs conhecidos" reescrito (só 2 reais: vehicles×fleet_vehicles duplicada; deceased_id obrigatório p/ free); api-handler.ts 2 any -> `Record<string, string | string[]>`.
- (e) Verificação independente 2026-09 do review externo (Claude): 165 erros ESLint, coverage eligibility.ts 32.43%, validation.ts 39.06%, 4/6 bugs do AGENTS.md desatualizados — TODAS confirmadas.
- (f) Ciclo lib/: recon read-only achou 9 funções dead em validation.ts + 2 em eligibility.ts (incluindo calculateEligibility com 80 linhas) e teste falso em holders.test.ts:28 (string-based: lia o source em vez de chamar isValidCPF).
- `358c811` removeu 161 linhas mortas; coverage subiu por REMOÇÃO (não por teste novo): eligibility 32->71%, validation 39->70%.
- `dc2be44` removeu 3 regex órfãos (CPF_REGEX, PHONE_REGEX, CNPJ_REGEX) + adicionou 5 casos de contrato para isWithinGracePeriod (janela, boundary, graceDays custom, string ISO); eligibility.ts agora 100% stmt/branch/func/line.
- (g) Cobertura api-handler.ts: 10 its novos cobrindo 409 MULTI_TENANT_SELECT, 403 blocked do SaaS gate, tenant sem gate, fail-open, IP fallbacks, params Promise, catch 500, superadmin bypass. Coverage: 89.7->100% stmt, 84.1->100% branch. Commit 2305a21.
- (h) Rodada 2026-09-27:
  - AGENTS.md: fleet_vehicles corrigida para "órfã (0 usos runtime)"; distinção de propósito documentada (src/types/domain.ts:52-57).
  - HANDOFF.md: riscos aceitos (asaas_api_key/FocusNFe plaintext) e ticket futuro commissions.isFirst registrados.
  - Removidos 5 exports dead confirmados por rg: useBilling (arquivo 84 linhas), isSuperAdminRole, DadosPayLoad, SAAS_REF_PREFIX, generateChargeWhatsAppUrl. Commit e5b12a6.
  - Verificação: focusnfeGet é falso-positivo (mantido por design, comentário L180-182 em focusnfe.ts).
  - repowise rodado com embedder=mock — NÃO confiável para unused_export (10/17 falso-positivo). Só hotspots de complexidade mereceram atenção.
- (i) Rodada 2026-10-01 (landing + URLs):
  - Fix link carteirinha: `next.config.ts` injetava `NEXT_PUBLIC_APP_URL || 'http://localhost:3000'` no bundle em build quando a env faltava na Vercel; o `|| window.location.origin` nunca disparava e todo link copiado saía como localhost. Criado `src/lib/publicUrl.ts` (`resolvePublicBaseUrl` prioriza `window.location.origin` em prod, env vira fallback dev/SSR). Bloco `env:` removido do `next.config.ts`. 5 testes de regressão. Commit `109b3cd`.
  - CarteirinhaButton: `🪪 Abrir` (`<a target="_blank">`) + botão `📋` secundário que copia (ícone troca para ✓/✕). Commit `96862f9`.
  - `scripts/screenshot.mjs`: Playwright para prints e vídeo autenticados (perfil persistente, login manual na 1ª execução). Modo print estável; modo vídeo em iteração. Commits `42dffee`, `d3d31e4`.
  - Landing: seção "Veja o sistema por dentro" com 2 prints reais + vídeo `demo.webm` (4,1 MB, autoplay muted loop playsInline). Vídeo encolhido para `max-w-4xl` e subtítulo com copy honesta. Commits `445a2c8`, `d3b624d`, `e0c8fd7`.
  - `TenantSettingsTab`: `webhookUrl` do Asaas estava hardcoded em `eternitysos.vercel.app` (quebraria em silêncio ao migrar de domínio) → `resolvePublicBaseUrl()`. Commit `9e82a97`.
  - Auditoria de URLs: sem outros bloqueadores. `next.config.ts` sem injeção de env; `VERCEL_URL` não usada; emails inexistentes (SEM_EMAILS).
- (j) Ciclo de performance 2026-10-01:
  - URLs (mesma rodada, detalhadas em (i)): `src/lib/publicUrl.ts` + fix do link da carteirinha `109b3cd`; CarteirinhaButton abrir/copiar `96862f9`; `TenantSettingsTab` webhookUrl `9e82a97`; `scripts/screenshot.mjs` (Playwright, prints + vídeo) `42dffee`/`d3d31e4`; landing com 2 prints + `demo.webm` `445a2c8`/`d3b624d`/`e0c8fd7`.
  - `perf(service-orders)`: GET era escrita (loop de UPDATE de 1 query por linha, até 100 por carga) e o POST fazia retry 3x com fallback sem token. Migration `20261001000000` (DEFAULT de `tracking_token`) + backfill; GET virou leitura pura; POST simplificou para 1 INSERT. Commit `32ff194`.
  - `perf(db)`: migration `20261001120000` cria `(tenant_id, created_at DESC)` em `holders` e `service_orders`. Sem o composto, o planner usava o índice de `tenant_id` e ordenava em memória. Commit `07fef83`.
  - Gargalo restante (NÃO corrigido): `GET /api/holders` tem paginação pronta (`.range()` + `count: exact`, `src/app/api/holders/route.ts:42-62`), mas o front chama sem `?page=` e cai no default `limit=1000`; `titulares/page.tsx:292` renderiza todas as `<tr>` sem virtualização. Avaliado como prematuro agora (clientes típicos têm poucos titulares) — a medição sensorial de ganho também não foi feita por esta sessão.


## 5. Pendências

1. NENHUMA técnica. Working tree limpo, main == origin/main.
2. AVISAR PEDRO: 4 rotas órfãs removidas — restaurar via `git revert bb66825` se houver cron externo.
3. PRÓXIMO ALVO (escolher na próxima sessão):
   (a) 32 warnings react-hooks/set-state-in-effect — refactor de UI, requer olho visual em cada tela; sprint dedicada.
   (b) fleet_vehicles — tabela órfã (0 usos runtime); decisão de produto ANTES de migrar/deletar.
   (c) 124 anys restantes — dívida distribuída, não urgente.
4. NaN/inválido em isWithinGracePeriod não testado (código ambíguo) — decidir se normaliza ou documenta.
5. **Riscos aceitos (não reabrir sem decisão explícita):**
   - `tenants.asaas_api_key` e token FocusNFe ficam em plaintext no banco.
     Decisão do produto: manter. Criptografia (pgcrypto/cofre externo) é
     ticket separado.
6. **Ticket futuro — `src/lib/commissions.ts` (`isFirst`):**
   Lógica assume que o pagamento atual já foi marcado 'paid' antes de contar.
   Se entrar importação de base histórica de outro sistema, o primeiro
   pagamento real pode ser classificado como recorrente. Não é bug hoje;
   é bomba se houver import. Documentar no código ou adicionar guard.
7. **`fleet_vehicles` — decisão binária (produto):**
   Ou constrói a feature (frota via bot WhatsApp, nunca implementada) ou
   dropa a tabela do schema. Não é "duplicação de vehicles" — propósitos
   distintos (`src/types/domain.ts:52-57`).
8. **Hotspots de complexidade** (repowise, não são bugs — sinalização para refactor futuro):
   - src/app/api/holders/import/route.ts — CCN 46 (import de planilha)
   - src/app/api/billing/asaas-batch/route.ts — nesting 5
   - src/app/api/billing/avulso/route.ts — CCN 37, nesting 5
   - src/app/api/init-user/route.ts — co-change com 19 arquivos
   Refactor deve vir com decisão de produto, não por métrica.
9. **Riscos auditados e NÃO corrigidos** (docs-only, aceitos):
   - `wa.me/5586988117925` hardcoded em 3 arquivos
     (`src/app/landing/page.tsx`, `src/components/SaasBanner.tsx`,
     `src/app/assinatura-suspensa/page.tsx`) — editar nos 3 quando trocar
     o número.
   - `src/content/legal/termos.ts:13` cita `eternitysos.vercel.app` como
     domínio oficial; atualizar ao migrar para domínio próprio.
   - `NEXT_PUBLIC_VERCEL_ENV` usada em `src/instrumentation-client.ts:9`
     mas ausente em `.env.example`; tem fallback NODE_ENV, sem urgência.
10. **Modo `video-full`** do `scripts/screenshot.mjs` nunca rodado (18 telas, ~68s).
11. **Migrations 2026-10-01 — aplicar no Supabase (NÃO confirmadas aplicadas):**
   - `20261001000000` — `tracking_token` DEFAULT. **OBRIGATÓRIA antes do deploy
     de `32ff194`**: sem o DEFAULT no banco, o POST cria OS com token NULL e o
     GET (já sem backfill) não repara — o QR `/track/[token]` nasce quebrado.
     Verificar criando uma OS nova e abrindo o QR.
   - `20261001120000` — índices compostos `(tenant_id, created_at DESC)`.
     Idempotente (`IF NOT EXISTS`), só performance, sem risco funcional.
12. **Perf futura (não urgente):** quando um cliente passar de ~500 titulares,
   retomar a paginação no front de `/titulares` (o back já tem `.range()` pronto;
   o front ignora e usa o default `limit=1000`). Ver item (j) em §4.


## 6. Gotchas

- Repo ≠ workspace do chat; sempre caminho absoluto `C:\Users\User\eternitysos`; pt-BR.
- No PowerShell usar `; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }`.
- Não ler arquivos gigantes; não carregar `graphify-out/`.
- Mexer em `src/app/api/` exige autorização explícita.
- Múltiplos `-m` em commit, NÃO `\n`.
- `tsc` exige recriar `next-env.d.ts` se gitignore limpar.
- Ao adicionar rota nova seguir `withAuth([...], { requireGlobal? })` + filtro `tenant_id` + `checkRateLimit`.
