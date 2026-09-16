# Jornada: Graphify + Refatoração do `page.tsx`

> **Última atualização:** 2026-09-16
> **Branch:** `main` (Fases 1-13 + 12b completas)
> **Último commit:** `7df956d` (grafo 12b-3)
> **Progresso:** Fases 1-13 + 12b · monolito removido · migrations aplicadas no remoto
> **Score geral:** 6.2 → **7.84** (+1.64)
> **Testes:** 177 (era 145)

---

## 1. Contexto

O projeto `eternitysos` (ERP funerário multi-tenant em Next.js 16 + React 19 + Supabase)
tinha um monolito de **~5081 linhas** em `src/app/page.tsx` com autenticação, fetching
de ~10 tabelas, autorização por aba e 12 tabs + 6 modais.

**Objetivo:** quebrar em rotas por domínio (padrão **Strangler Fig**).

**Ferramentas integradas:** Graphify (grafo de símbolos), Repowise (saúde Git),
Code-Ranker (complexidade estrutural), Supabase CLI (schema versionado + tipos).

---

## 2. Ferramentas

### 2.1 Graphify (0.9.61)
- Gera `graph.json`, `GRAPH_REPORT.md`, `graph.html`
- **Setup:** `Set-Alias graphify "C:\Python314\Scripts\graphify.exe"` + backend Groq (`openai/gpt-oss-120b`, `--batch-size 50`)
- **Grafo atual:** ~3797 nós, ~5683 arestas, ~396 comunidades, 43 arquivos SQL

**Hubs (god modules):**
| Símbolo | Conexões |
|---|---|
| `isValidUUID()` | 81 |
| `supabaseAdmin.ts` | 72 |
| `supabaseAdmin` (instância) | 69 |
| `withAuth` (`api-handler.ts`) | 69 |
| `sanitizeString()` | 67 |

**Regra de ouro:** consumir esses módulos, nunca alterar assinaturas.

### 2.2 Repowise
- 10 ferramentas MCP (`get_health`, `get_change_risk`, `get_dead_code`, etc.)
- CLI fresco: `repowise health --file`
- **Evolução do score:**
  | Momento | Score | Pior |
  |---|---|---|
  | Pré-refatoração | 6.2 | `page.tsx` (1.0) |
  | Pós-Fase 4c | 6.41 | `webhooks/asaas` (1.0) |
  | Pós-Fase 5 | 6.85 | `webhooks/asaas` (1.0) |
  | Pós-Fase 6g-6d | **7.84** | `webhooks/asaas` (3.4 CLI) |

### 2.3 Code-Ranker (5.0.4)
- Análise estrutural: SLOC, cognitive, MI, HK, fan-in/out
- 13 princípios (CPX, SRP, DRY, KISS, ADP, DIP, LSP, ISP, LoD, MISU, CoI, OCP, YAGNI)
- Relatório em `docs/CODE-RANKER.md`

### 2.4 Supabase CLI (2.117.0)
- Schema versionado (`supabase/migrations/`) + banco local Docker + tipos TS
- Tipos: `src/types/supabase.ts` (169 KB)
- Comandos: `npx supabase start|stop|db pull|db push|gen types typescript --local`

---

## 3. Plano de refatoração — 13 fases + 12b

### 3.1 Fases macro

| Fase | Escopo | Status |
|---|---|---|
| **1** | Plans + Sellers | ✅ main |
| **2** | Titulares + Dependentes + Contratos + Import CSV | ✅ main |
| **3** | CRM + Benefícios + Convalescença + Fiscal + Navegação | ✅ main |
| **4** | Serviço Funerário (Frota, Estoque, Capela, OS, Sepultamentos, Logística) | ✅ main (exceto 4d-2) |
| **5** | Billing Asaas + Livro Caixa + Reservas + Contas a Pagar + Auditoria | ✅ main |
| **6** | Auth + Providers + **remover monolito** | ✅ main |
| **7** | Testes comportamentais (5 rotas API) | ✅ main |
| **8** | Sidebar lateral | ✅ main |
| **9** | Dashboard unificado na home | ✅ main |
| **10** | Polish visual (QuickLinks, Sidebar, RecentActivity, tema claro) | ✅ main |
| **11** | Limpeza técnica + security | ✅ main |
| **12** | Diferenciais (Gateway fix, Cobrar na OS, NFS-e na OS, QR tracking) | ✅ main |
| **13** | Venda Avulsa (responsável persistido + wizard `/vendas/nova`) | ✅ main |

### 3.2 Fase 6 — Remover monolito (17 sub-fases)

| Sub-fase | Escopo |
|---|---|
| 6a/6b | Diagnóstico do monolito + financial inline |
| 6c | Extrair `executive` → `/executivo` |
| 6d-0a/0b/0c | Modais DRE/Carnets/Cobrança + Vendas Avulsas + ThemeToggle |
| 6e | Remover `TenantProvider` (código morto) |
| 6f | Esconder links por role |
| 6g-1 | RBAC → `/usuarios` |
| 6g-2 | TenantSettings → `/configuracoes` |
| 6g-3 | ModalWebhookRetry → BillingTab |
| 6g-4 | Tela de pendência de aprovação |
| 6g-5 | Portar 2 impressões (Termo + Guia) |
| 6g-6a/b/c | CRUD titular + DELETE sepultamento + Logout |
| 6g-6d | **REMOVER MONOLITO + HomeRedirect** |

**Impacto:** `page.tsx` **5081 → 50 linhas**. Score **6.85 → 7.84**.

### 3.3 Fase 7 — Testes comportamentais (+33 testes)

| Rota | Testes |
|---|---|
| `webhooks/asaas` | 6 (+2 na 11d) |
| `holders` | 6 |
| `billing/asaas-batch` | 6 |
| `billing/pix` | 8 |
| `payments/pix` | 7 |

**Helper:** `tests/helpers/api-mocks.ts` (`mockSupabaseAdmin`, `mockRateLimit`, `mockWithAuth`, `mockAsaasFetch`, `makeChain`, `makeAsaasRequest`).

**Regressão recuperada (7b):** bloco de sync `plan_id` no PATCH `/api/holders` (perdido após 6g-6a).

### 3.4 Fases 8-11

- **8a/8b:** Sidebar (`w-64`) + header compacto; drawer mobile
- **9a:** `/` renderiza `<ExecutiveTab />` + `<QuickLinks />` inline
- **10a-10d:** ícones lucide, indicador grupo ativo, RecentActivity, tema claro no shell
- **11a:** Remover `printReports.ts` (−228 linhas)
- **11b:** Diagnóstico `vehicles` × `fleet_vehicles` (legado no banco, sem remoção)
- **11c:** Fix persistência estoque +/- via `PATCH /api/inventory`
- **11d-1:** Travar token curto em teste (não bloquear)
- **11d-2:** Cancelado (billing tem `allowedRoles`)

### 3.8 Fase 12 — Diferenciais competitivos

| Sub-fase | Escopo | Status |
|---|---|---|
| 12a | Remover modal Gateway duplicado (fix F-29) → link `/configuracoes#gateway` | ✅ |
| 12c-1 | Botão "💰 Cobrar avulso" na OS (modal pré-preenchido) | ✅ |
| 12c-2 | Botão "🧾 Emitir NFS-e" na OS (modal novo) | ✅ |
| 12b-1 | Token de tracking em `service_orders` + backfill + migration | ✅ |
| 12b-2 | Botão "🔗 QR" em `/ordens` + `ModalQrOS` (impressão isolada) | ✅ |
| 12b-3 | Rota pública `/track/[token]` + AuthGuard libera `/track` | ✅ |
| 12d (Mapa) | Adiado | ⏸️ |
| 12e (Assinatura digital) | Adiado | ⏸️ |

**Impacto:** bug F-29 resolvido (−170 linhas), fluxo manual de venda em 1 tela, QR Code tracking público por OS (rota `/track/[token]` sem PII).

### 3.9 Fase 13 — Venda Avulsa completa

| Sub-fase | Escopo | Status |
|---|---|---|
| 13a | Migration `responsavel_*` em `service_orders` + POST ampliado | ✅ |
| 13b | Rota orquestradora server-side | ❌ Pulada (atomicidade distribuída impossível) |
| 13c-1 | Extrair `ItemsForm` + `ResponsavelForm` (reuso) | ✅ |
| 13c-2 | Wizard `/vendas/nova` (5 steps + 3 POSTs sequenciais) | ✅ |

**Impacto:** venda balcão em 1 tela; responsável avulso persistido no banco; degradação graciosa (falha de cobrança/NF não desfaz OS).

**Migrations no remoto:** ✅ aplicadas em 2026-09-16 (`responsavel_*` + `tracking_token`).

---

## 4. Blast radius (Graphify)

| Fase / Sub-fase | Nós 1-hop | Arestas |
|---|---|---|
| Fase 1 | 46 | 78 |
| Fase 2 inteira | 79 | 169 |
| Fase 4c | ~22 | ~50 |
| Fase 5 | ~25 | ~55 |
| Fase 6g-6d | máximo | máximo |

**Insight:** Fase 2 teve ~2× o blast da Fase 1 (contratos são consumidos por 8 módulos de cobrança/serviço). `eligibility.ts` intocável (8 símbolos).

---

## 5. Padrões e decisões

### 5.1 Copiar, não mover
`page.tsx` intacto (diff zero) até 6g-6d. Rota nova independente. Rollback = deletar pasta.

### 5.2 Fluxo autônomo por sub-fase
```
1. Reconhecimento (Select-String, 4-6 seções) → PARAR
2. Execução: criar → tsc → jest → git commit → graphify update → git commit
3. Teste manual no browser → próxima
```

### 5.3 Regras de contexto
- NUNCA ler arquivos > 500 linhas por inteiro
- NUNCA carregar `graph.json`/`GRAPH_REPORT.md`/`graph.html`
- UMA ferramenta MCP por mensagem
- Respostas em até 10 linhas

### 5.4 APIs
- NUNCA modificar `src/app/api/` sem autorização explícita
- Criar novo endpoint APENAS com: `withAuth` + `tenant_id` + justificativa + autorização

### 5.5 Tailwind
- Classes dinâmicas (`border-l-${cor}`) são purgadas
- Usar lookups estáticos (`ACTIVE_BORDER: Record<string, string>`)

---

## 6. Aprendizados sobre IA

### Modelos que NÃO servem
- **Solar Pro 4:** loop infinito, alucinação, encoding corrompido
- **Laguna S 2.1:** "runs short" em sessões longas, mistura espanhol

### Modelos recomendados
- **DeepSeek** (pago, barato, estável)
- **Groq `openai/gpt-oss-120b`** (grátis, TPM 8000)
- **Claude Sonnet** (pago)

### Regra prática
- Refatorações mecânicas → manual ou IA com código pronto
- CRUDs simples → IA funciona bem
- Tarefas críticas → sempre revisar
- Loop de pergunta → **reiniciar sessão** (context compacted)
- Tarefa grande + joins complexos → **dividir em 2 tarefas menores**

---

## 7. Commits e histórico

### Sequência de merges
1. `refactor/fase-1-plans-sellers` → main
2. `refactor/fase-2-titulares` → main (5 sub-fases)
3. `refactor/fase-3-crm-fiscal` → main (6 sub-fases)
4. `refactor/fase-4-servico-funerario` → main (5 sub-fases)
5. `refactor/fase-5-cobranca-financeiro` → main (9 sub-fases)
6. `refactor/fase-6-auth-limpeza` → main (17 sub-fases)
7. `refactor/fase-8-sidebar` → main (Fases 8+9+10)
8. `refactor/fase-11-limpeza` → main
9. `refactor/fase-12-diferenciais` → main (12a, 12c-1, 12c-2)
10. `refactor/fase-13-venda-avulsa` → main (13a, 13c-1, 13c-2)
11. `refactor/fase-12b-qrcode` → main (12b-1, 12b-2, 12b-3)

### Estrutura
Cada sub-fase = 2 commits (`refactor(fase-XX)` + `chore: grafo`). Total ~200.

### Fixes notáveis
- `deceased_type`, `deceased_id`, `<Link>` + `<a>` (Next 16)
- `/fiscal` tab mapeamento (6f)
- `plan_id` sync recuperado (7b)
- Dropdowns fechar (layout)
- HomeRedirect `/executivo` prioritário
- `.gitignore` padrão `graphify-out/20*/` + `backup-*.sql`
- Estoque +/- PATCH (11c)
- Gateway Asaas duplicado F-29 (12a)

---

## 8. Artefatos

| Arquivo | Descrição |
|---|---|
| `graphify-out/graph.json` | Grafo técnico (~2.4 MB) |
| `graphify-out/GRAPH_REPORT.md` | Relatório legível |
| `graphify-out/graph.html` | Visualização interativa |
| `docs/GRAPHIFY.md` | Doc manual (~604 linhas) |
| `docs/CODE-RANKER.md` | Análise estrutural |
| `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md` | Este arquivo |
| `AGENTS.md` | Instruções para agentes |
| `supabase/migrations/` | Schema versionado (2 migrations novas: `responsavel_*` + `tracking_token`) |
| `src/types/supabase.ts` | Tipos do banco (169 KB) |
| `tests/helpers/api-mocks.ts` | Helpers de teste |
| `src/components/forms/` | `ItemsForm` + `ResponsavelForm` (reuso) |
| `src/components/modals/ModalQrOS.tsx` | Modal QR |
| `src/app/track/[token]/page.tsx` | Rota pública de tracking |

---

## 9. Estado atual do dashboard

### 9.1 Navegação
- **Sidebar** (`w-64`) com 6 grupos / 25 itens
- **Header compacto:** hamburger + slogan + ThemeToggle + Sair
- **Mobile:** drawer + overlay
- **Filtro por role:** `isTabAllowed`
- **Tema dual:** shell novo suporta claro/escuro

### 9.2 Home (`/`)
- Roles com `executive`: `<ExecutiveTab />` + `<QuickLinks />` + `<RecentActivity />` + data
- Outros roles: redirect para primeira rota permitida

### 9.3 Rotas (26)

| Grupo | Rotas |
|---|---|
| Cadastros | `/executivo`, `/titulares`, `/dependentes`, `/contratos`, `/frota`, `/estoque` |
| Operacional | `/tanatopraxia`, `/capela`, `/ordens`, `/sepultamentos`, `/logistica` |
| Comercial | `/vendas/nova`, `/planes`, `/vendedores`, `/crm` |
| Benefícios | `/beneficios`, `/convalescencia` |
| Financeiro | `/fiscal`, `/financeiro`, `/livro-caixa`, `/contas-a-pagar` |
| Admin | `/auditoria`, `/usuarios`, `/configuracoes` |

### 9.4 Públicas
`/login`, `/landing`, `/carteirinha/[cpf]`, `/track/[token]`

### 9.5 APIs cobertas por testes
- `webhooks/asaas`: 8 · `holders`: 6 · `billing/asaas-batch`: 6 · `billing/pix`: 8 · `payments/pix`: 7

---

## 10. Próximos passos (opcionais)

### 12d — Mapa georreferenciado de jazigos
- [ ] Biblioteca Leaflet + geocoding + visualização no `/sepultamentos`

### 12e — Assinatura digital
- [ ] Integração DocuSign/Clicksign (termos, contratos)

### 11e — Enforcement de token forte (webhook Asaas)
- [ ] Migrar tokens curtos dos tenants + bloquear <16 chars

### Fase 14 — Consolidação de tabelas
- [ ] Dump + drop `fleet_vehicles` e `fleet_expenses`

### Fase 15 — Testes adicionais
- [ ] Cobrir novos endpoints de venda avulsa (13c)
- [ ] Teste E2E do wizard `/vendas/nova`
- [ ] Teste da rota pública `/track/[token]`

---

## 11. Bugs conhecidos

### Resolvidos
- [x] Estoque +/- (11c)
- [x] Duplicação `page.tsx` × `TenantSettingsTab`
- [x] `loadData` CCN 44
- [x] `TenantProvider` morto
- [x] `printReports.ts` morto
- [x] Gateway Asaas duplicado (F-29) — 12a
- [x] Migration remota pendente — aplicada em 2026-09-16

### Pendentes
- [ ] `webhooks/asaas` token fraco (só loga, não bloqueia)
- [ ] `vehicles` × `fleet_vehicles` (legado no banco)
- [ ] `allowedRoles` billing inconsistentes
- [ ] `deceased_id` obrigatório para tipo `free`
- [ ] Tabs antigas sem tema dual
- [ ] Cobertura de testes para wizard de venda (13c)

---

## 12. Comandos rápidos

### Graphify
```powershell
graphify update .                 # incremental, sem LLM
graphify cluster-only .           # relatório + comunidades
graphify label . --batch-size 50  # renomear comunidades
```

### Code-Ranker
```powershell
code-ranker report .
code-ranker docs ts <ID>
```

### Supabase
```powershell
npx supabase start|stop|status
npx supabase db pull
npx supabase db push              # aplica migrations no remoto
npx supabase migration list --linked
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Testar
```powershell
npx tsc --noEmit
npm run dev
npx jest
npx jest tests/routes/<nome>
```

### Repowise
```
repowise health --file <arquivo>
repowise update
```

---

## 13. Links úteis

- [Graphify](https://pypi.org/project/graphifyy/)
- [Repowise](https://pypi.org/project/repowise/)
- [Code-Ranker](https://github.com/code-ranker-com/code-ranker)
- [Groq Console](https://console.groq.com/keys)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

---

**Fim do registro.** Atualizar ao final de cada fase.