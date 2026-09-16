# Jornada: Graphify + Refatoração do `page.tsx`

> **Última atualização:** 2026-09-16
> **Branch:** `refactor/fase-11-limpeza` (pré-merge)
> **Último commit:** `f6f86b3` (token curto test)
> **Progresso:** Fases 1-11 completas · monolito removido
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
- **Grafo atual:** ~3800 nós, ~5500 arestas, ~380 comunidades, 43 arquivos SQL

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
- Comandos: `npx supabase start|stop|db pull|gen types typescript --local`

---

## 3. Plano de refatoração — 11 fases

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
| **11** | Limpeza técnica + security | ✅ branch |

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

**Helper:** `tests/helpers/api-mocks.ts` (mockSupabaseAdmin, mockRateLimit, mockWithAuth, mockAsaasFetch, makeChain, makeAsaasRequest).

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
8. `refactor/fase-11-limpeza` → main (pendente)

### Estrutura
Cada sub-fase = 2 commits (`refactor(fase-XX)` + `chore: grafo`). Total ~200.

### Fixes notáveis
- `deceased_type`, `deceased_id`, `<Link>` + `<a>` (Next 16)
- `/fiscal` tab mapeamento (6f)
- `plan_id` sync recuperado (7b)
- Dropdowns fechar (layout)
- HomeRedirect `/executivo` prioritário
- `.gitignore` padrão `graphify-out/20*/`
- Estoque +/- PATCH (11c)

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
| `supabase/migrations/` | Schema versionado |
| `src/types/supabase.ts` | Tipos do banco (169 KB) |
| `tests/helpers/api-mocks.ts` | Helpers de teste |

---

## 9. Estado atual do dashboard

### 9.1 Navegação
- **Sidebar** (`w-64`) com 6 grupos / 24 itens
- **Header compacto:** hamburger + slogan + ThemeToggle + Sair
- **Mobile:** drawer + overlay
- **Filtro por role:** `isTabAllowed`
- **Tema dual:** shell novo suporta claro/escuro

### 9.2 Home (`/`)
- Roles com `executive`: `<ExecutiveTab />` + `<QuickLinks />` + `<RecentActivity />` + data
- Outros roles: redirect para primeira rota permitida

### 9.3 Rotas (24)
| Grupo | Rotas |
|---|---|
| Cadastros | `/executivo`, `/titulares`, `/dependentes`, `/contratos`, `/frota`, `/estoque` |
| Operacional | `/tanatopraxia`, `/capela`, `/ordens`, `/sepultamentos`, `/logistica` |
| Comercial | `/planes`, `/vendedores`, `/crm` |
| Benefícios | `/beneficios`, `/convalescencia` |
| Financeiro | `/fiscal`, `/financeiro`, `/livro-caixa`, `/contas-a-pagar` |
| Admin | `/auditoria`, `/usuarios`, `/configuracoes` |

### 9.4 Públicas
`/login`, `/landing`, `/carteirinha/[cpf]`

### 9.5 APIs cobertas por testes
- `webhooks/asaas`: 8 | `holders`: 6 | `billing/asaas-batch`: 6 | `billing/pix`: 8 | `payments/pix`: 7

---

## 10. Próximos passos (opcionais)

### Fase 12 — Diferenciais competitivos
- [ ] Mapa georreferenciado de jazigos
- [ ] QR Code tracking
- [ ] Assinatura digital
- [ ] Config Gateway Asaas: persistir (F-29)

### Fase 11e — Enforcement de token forte
- [ ] Migrar tokens curtos dos tenants
- [ ] Trocar logError por bloqueio 401/403

### Fase 13 — Polish adicional
- [ ] Tabs antigas com tema dual
- [ ] Alinhar `allowedRoles` de billing

### Fase 14 — Consolidação de tabelas
- [ ] Dump + drop `fleet_vehicles` e `fleet_expenses`

---

## 11. Bugs conhecidos

### Resolvidos
- [x] Estoque +/- (11c)
- [x] Duplicação `page.tsx` × `TenantSettingsTab`
- [x] `loadData` CCN 44
- [x] `TenantProvider` morto
- [x] `printReports.ts` morto

### Pendentes
- [ ] `webhooks/asaas` token fraco (só loga)
- [ ] `vehicles` × `fleet_vehicles` (legado no banco)
- [ ] `allowedRoles` billing inconsistentes
- [ ] Gateway Asaas form não persiste (F-29)
- [ ] `deceased_id` obrigatório para tipo `free`
- [ ] Tabs antigas sem tema dual

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