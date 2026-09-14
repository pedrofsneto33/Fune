# Jornada: Graphify + Refatoração do `page.tsx`

> Registro cronológico da integração do Graphify ao projeto `eternitysos`
> e das fases de refatoração do monolito `src/app/page.tsx` (~4942 linhas).
>
> **Última atualização:** 2026-09-14
> **Branch atual:** `refactor/fase-6-auth-limpeza` (pré-merge Fase 5)
> **Último commit:** `7300290` (links 5c-3 — Fase 5 completa)
> **Progresso:** Fases 1, 2, 3, 4, 5 completas · Fase 6 (última) próxima
> **Score `page.tsx`:** 1.0 → **1.4** (medido após Fase 4c)
> **Testes:** 146 passando

---

## 1. Contexto e motivação

O projeto `eternitysos` (ERP funerário multi-tenant em Next.js 16 + React 19 + Supabase)
tem um monolito frontend de **~4942 linhas** em `src/app/page.tsx` que concentra:

- Autenticação e estado do tenant
- Fetching direto ao Supabase de ~10 tabelas
- Autorização por aba (`isTabAllowed`)
- Renderização de 6 tabs + 6 modais

**Objetivo da refatoração:** quebrar esse monolito em rotas separadas por domínio,
seguindo o padrão **Strangler Fig** (construir o novo em paralelo, remover o antigo depois).

**Objetivo do Graphify:** ter um **mapa real do código** (grafo de símbolos) para
medir blast radius de cada mudança antes de executá-la.

**Objetivo do Repowise:** camada adicional de inteligência (histórico Git, score de saúde,
análise de risco de commits, código morto).

---

## 2. Graphify — instalação e configuração

### Ferramenta
- **Nome:** Graphify (`graphifyy` no PyPI)
- **Versão instalada:** 0.9.61
- **Função:** gera `graph.json`, `GRAPH_REPORT.md` e `graph.html` a partir do código

### Desafios resolvidos

| Problema | Solução aplicada |
|---|---|
| Pacote Python não encontrava `tree-sitter-sql` | Instalado via `C:\Python314\Scripts\graphify.exe` (evitar o `~/.local/bin/graphify.exe`) |
| Alias permanente para o binário correto | `Set-Alias graphify "C:\Python314\Scripts\graphify.exe"` no `$PROFILE` |
| Backend Ollama falhava (`openai not installed`) | Instalado via `uv tool install "graphifyy[openai]" --force` |
| Groq free tier com TPM 8000 | `--batch-size 50` no `graphify label` |
| Modelo Groq `llama-3.3-70b-versatile` descontinuado | Trocado para `openai/gpt-oss-120b` |
| Cache do Graphify versionado (lixo) | Adicionado ao `.gitignore`: `graphify-out/cache/` e `graphify-out/2026-09-13/` |

### Configuração de ambiente (PowerShell)

```powershell
# Alias permanente
Set-Alias graphify "C:\Python314\Scripts\graphify.exe"

# Backend Groq (para nomear comunidades)
$env:OPENAI_BASE_URL = "https://api.groq.com/openai/v1"
$env:OPENAI_API_KEY = "sua_chave_groq"
$env:OPENAI_MODEL = "openai/gpt-oss-120b"

# Comando de rotina
graphify update .                    # atualizar grafo (incremental, sem LLM)
graphify cluster-only .              # regerar relatório + nomear comunidades
graphify label . --batch-size 50     # só renomear comunidades
```

### Estado final do grafo (após Fase 5)

| Métrica | Valor |
|---|---|
| Nós | ~3700 |
| Arestas | ~5200 |
| Comunidades | ~380 |
| Cobertura | 99% EXTRACTED, 1% INFERRED |
| Arquivos SQL | 43 incluídos via `tree-sitter-sql` |

### Hubs identificados (god modules)

| Símbolo | Papel | Conexões |
|---|---|---|
| `isValidUUID()` | Validação de UUID em `src/lib/validation.ts` | 81 |
| `supabaseAdmin.ts` | Cliente Supabase service-role | 72 |
| `supabaseAdmin` (instância) | Instância exportada | 69 |
| `api-handler.ts` (`withAuth`) | Middleware JWT/RBAC/rate-limit | 69 |
| `sanitizeString()` | Sanitização em `src/lib/validation.ts` | 67 |

**Regra de ouro:** consumir esses módulos, nunca alterar suas assinaturas.

---

## 3. Repowise — camada adicional de inteligência

### Ferramenta
- **Nome:** Repowise (`pip install repowise`)
- **Integração:** servidor MCP com 10 ferramentas
- **Função:** histórico Git, saúde do código, risco de commits, código morto, "por quê" de decisões

### Ferramentas MCP disponíveis

- `get_overview`, `get_context`, `get_symbol`, `get_why`
- `get_change_risk`, `get_risk`, `get_health`
- `get_dead_code`, `get_answer`, `search_codebase`

### Uso no fluxo

- **Antes de commitar sub-fase crítica:** `get_change_risk`
- **Depois de sub-fase grande:** `get_health`
- **Fase 6 (remover monolito):** `get_dead_code`
- **Máximo 1 chamada por sub-fase** (evitar estouro de contexto)

### Insight inicial (pré-refatoração)

- Score geral: 6.2/10 ("fair")
- **Pior performer: `src/app/page.tsx` (score 1.0)**
- 31 hotspots, 968 findings abertos
- Zero arquivos estáveis em 90 dias

### Evolução pós-Fase 4c

- **Score `page.tsx`: 1.0 → 1.4 (+0.4)** — primeira mudança após 19 medições
- Score geral: 6.2 → 6.41
- Novo pior performer: `src/app/api/webhooks/asaas/route.ts` (score 1.0)

---

## 4. Plano de refatoração — 6 fases

### Fases macro (por risco crescente)

| Fase | Escopo | Status |
|---|---|---|
| **1** | Plans + Sellers (abas folha) | ✅ Na main |
| **2** | Titulares + Dependentes + Contratos + Import CSV | ✅ Na main |
| **3** | CRM + Benefícios + Convalescença + Fiscal + Navegação | ✅ Na main |
| **4** | Serviço Funerário (Frota, Estoque, Tanatopraxia, Capela, OS, Sepultamentos, Logística) | ✅ Na main (exceto 4d-2) |
| **5** | Cobrança + Financeiro (Billing Asaas, Livro Caixa, Reservas, Contas a Pagar, Auditoria) | ✅ Na main |
| **6** | Auth + Providers + remover monolito | ⏳ Próxima (última) |

### Fase 2 — detalhamento

| Sub-fase | Escopo | Status |
|---|---|---|
| 2a | Leitura `/titulares` (quick-search + GET holders) | ✅ |
| 2b | CRUD `/dependentes` | ✅ |
| 2c | Import CSV `/titulares/importar` | ✅ |
| 2d | `/contratos` + elegibilidade | ✅ |
| 2e | Extrair tipos para `src/types/domain.ts` | ✅ |

### Fase 3 — detalhamento

| Sub-fase | Escopo | Status |
|---|---|---|
| 3a | `/crm` (CrmTab envelopado) | ✅ |
| 3b | Link `/crm` no layout | ✅ |
| 3c-1 | `/beneficios` (BenefitsTab novo — 274 linhas) | ✅ |
| 3c-2 | `/convalescencia` (ConvalescenceTab novo — 336 linhas) | ✅ |
| 3d | `/fiscal` (FiscalTab envelopado) | ✅ |
| 3e | Navegação completa com dropdowns agrupados | ✅ |

### Fase 4 — detalhamento

| Sub-fase | Escopo | Status |
|---|---|---|
| 4a | Frota (`/frota`), Estoque (`/estoque`) | ✅ |
| 4b | Tanatopraxia (`/tanatopraxia`), Capela (`/capela`) | ✅ |
| 4c | Ordens de Serviço (`/ordens`, `/ordens/nova`, cancelar), Sepultamentos (`/sepultamentos`) | ✅ |
| 4d-1 | Logística (`/logistica` — dispatches + auditoria + rotas de coletor) | ✅ |
| 4d-2 | Emergências (adiada — fallback via `whatsappAgent.ts`) | ⏸️ |
| 4d-3 | Link `/logistica` no dropdown Operacional | ✅ |

### Fase 5 — detalhamento

| Sub-fase | Escopo | Status |
|---|---|---|
| 5a-1 | `/financeiro` read-only (BillingTab) | ✅ |
| 5a-2 | Lote Asaas + baixa manual | ✅ |
| 5a-3 | Link `/financeiro` no layout | ✅ |
| 5b-1 | `/livro-caixa` (FinancialTab — transactions) | ✅ |
| 5b-2 | Summary + reservas regulatórias (Lei 13.261/2016) | ✅ |
| 5b-3 | Link `/livro-caixa` no layout | ✅ |
| 5c-1 | `/contas-a-pagar` (AccountsPayableTab — API órfã) | ✅ |
| 5c-2 | `/auditoria` (AuditLogsTab — API órfã, read-only) | ✅ |
| 5c-3 | Links + novo dropdown Admin no layout | ✅ |

### Destaques da Fase 4

- Primeira sub-fase que **criou endpoint novo** (`GET /api/dispatches`) — API órfã
- 3 bugs corrigidos em produção: `deceased_type`, `deceased_id`, `<Link>` com `<a>` (Next.js 16)
- Teste `routes-auth.test` detecta automaticamente que toda nova rota API tem `withAuth`
- 146 testes ao final (subiu de 145)
- Score `page.tsx`: **1.0 → 1.4** (+0.4)

### Destaques da Fase 5

- 2 APIs órfãs expostas: `accounts-payable` e `audit-logs`
- Reservas regulatórias com gráficos (Lei 13.261/2016)
- Novo dropdown "Admin" no layout
- Nenhuma alteração em `page.tsx` (regra mantida)
- Sub-fase 5a-2 lida com dinheiro real no Asaas (cuidado redobrado)

---

## 5. Blast radius medido pelo Graphify

| Fase / Sub-fase | Nós seed | Nós 1-hop | Arestas |
|---|---|---|---|
| Fase 1 (executada) | 26 | 46 | 78 |
| Fase 2 inteira | 40 | 79 | 169 |
| Fase 2a | ~12 | ~12 | ~20 |
| Fase 2b | ~15 | ~15 | ~30 |
| Fase 2c | ~8 | ~8 | ~15 |
| Fase 2d | ~20 | ~20 | ~45 |
| Fase 2e | ~30 | ~30 | ~60 |
| Fase 4c (OS + Burials) | ~22 | ~22 | ~50 |
| Fase 5 (Billing + Financial) | ~25 | ~25 | ~55 |

**Insight crítico:** a Fase 2 tem **~2× o blast radius da Fase 1** porque contratos/titulares
são consumidos por **8 módulos de cobrança/serviço** (asaas-batch, pix, boleto,
generate-cycles, payment-carnets, service-orders, convalescence, page.tsx).

**`eligibility.ts` é intocável nesta fase.** Mudar a assinatura de qualquer um dos
seus 8 símbolos quebra produção. A regra é **consumir, nunca alterar**.

---

## 6. Padrões e decisões estabelecidas

### 6.1 Opção A — Copiar, não mover

**Regra:** em cada sub-fase, criar rota nova **copiando** lógica do `page.tsx`,
sem modificar `page.tsx`. Duplicação temporária é aceitável; divergência não.

- ✅ `page.tsx` permanece 100% intacto (diff zero)
- ✅ Rota nova é independente
- ✅ Rollback = deletar a pasta nova
- ⚠️ Duplicação existe até a Fase 6

### 6.2 Fluxo autônomo por sub-fase

Cada sub-fase segue o ciclo:

```
1. Reconhecimento (só se nova):
   - Select-String para mapear APIs e tipos
   - Responder em 4 seções curtas. PARAR.

2. Execução (após autorização):
   - Criar arquivos
   - npx tsc --noEmit (máx 3 tentativas de correção)
   - npx jest
   - git add + git commit -m "refactor(fase-XX): ..."
   - graphify update .
   - git add graphify-out/ + git commit -m "chore: atualizar grafo"
   - Reportar em até 10 linhas

3. Teste manual no browser → próxima sub-fase
```

### 6.3 Regras de contexto (economia de tokens)

- **NUNCA** ler arquivos > 500 linhas por inteiro
- **NUNCA** carregar `graph.json`/`GRAPH_REPORT.md`/`graph.html` no contexto
- **NUNCA** ler `src/app/page.tsx` inteiro — usar `Select-String`
- **UMA** ferramenta MCP por mensagem
- Respostas em no máximo 10 linhas

### 6.4 Regra refinada sobre APIs

- **NUNCA modificar** arquivos existentes em `src/app/api/` sem autorização explícita
- **Criar novos** endpoints é permitido APENAS com:
  - `withAuth` + `tenant_id` filter
  - Justificativa (endpoint ausente para funcionalidade órfã)
  - Autorização explícita no prompt da sub-fase

---

## 7. Aprendizados sobre IA

### Modelos que NÃO servem para refatoração de código

**Upstage Solar Pro 4 (via Cline)** — sintomas observados:
- Loop infinito de "Resposta final" (100+ linhas repetidas)
- Alucinação de arquivos criados que nunca existiram
- Corrupção de encoding (`Cônjuge` → `CÃ´njuge`)
- Picar funções em pedaços e remontar fora de ordem
- Imports corrompidos: remover `@` de `@/lib/...`
- Inserir anotações inválidas (`(see below for file content)`)

**Poolside Laguna S 2.1** — melhor que Solar, mas:
- "Runs short" em sessões longas (perde contexto no meio de execução)
- Mistura espanhol com pt-BR consistentemente
- Aceitável para tarefas focadas, não para refatorações grandes

### Modelos recomendados

- **DeepSeek** (pago, barato, estável) — preferido
- **Groq `openai/gpt-oss-120b`** (grátis, com TPM 8000)
- **Claude Sonnet** (pago, excelente)

### Regra prática

- Refatorações mecânicas com padrão claro → **manual ou IA com código pronto**
- CRUDs simples → **IA funciona bem**
- Tarefas críticas (dinheiro, auth) → **sempre revisar**

---

## 8. Commits e histórico

### Branch `main` (estado atual)

Todos os commits das Fases 1-5 estão consolidados aqui após merges sucessivos.

### Sequência de merges

1. **Fase 1** — `refactor/fase-1-plans-sellers` → main
2. **Fase 2** — `refactor/fase-2-titulares` → main (5 sub-fases)
3. **Fase 3** — `refactor/fase-3-crm-fiscal` → main (6 sub-fases)
4. **Fase 4** — `refactor/fase-4-servico-funerario` → main (5 sub-fases efetivas)
5. **Fase 5** — `refactor/fase-5-cobranca-financeiro` → main (9 sub-fases efetivas)

### Estrutura de commits por sub-fase

Cada sub-fase gera **2 commits**:
- `refactor(fase-XX): <descrição>` — código
- `chore: atualizar grafo apos XX` — grafo

Total estimado: **~120 commits** (60 refactors + 60 grafo).

### Fixes notáveis (fora do fluxo normal)

- `fix(fase-4c-2b): remover mapeamento desnecessario de deceased_type`
- `fix(fase-4c-2b): preencher deceased_id obrigatorio pela API`
- `fix(fase-4c-2a): remover <a> dentro de <Link> (Next.js 16)`

---

## 9. Artefatos gerados

| Arquivo | Tamanho | Descrição |
|---|---|---|
| `graphify-out/graph.json` | ~2.4 MB | Grafo técnico |
| `graphify-out/GRAPH_REPORT.md` | ~36 KB | Relatório legível |
| `graphify-out/graph.html` | ~2 MB | Visualização interativa |
| `docs/GRAPHIFY.md` | ~604 linhas | Documento manual escrito pelo Cline |
| `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md` | este arquivo | Registro cronológico |
| `AGENTS.md` | ~120 linhas | Instruções para agentes de IA |
| `.repowise/` | local | Índice local do Repowise (não versionado) |

---

## 10. Próximos passos

### Fase 6 — Auth + remover monolito (última fase)

- [ ] 6a: Consolidar AuthGuard, TenantContext, ThemeToggle no layout raiz
- [ ] 6b: Adicionar controle de role no frontend (para esconder links restritos)
- [ ] 6c: Remover tabs restantes do `page.tsx`
- [ ] 6d: Remover `page.tsx` (após tudo migrado)
- [ ] 6e: Consolidar `TenantProvider` (hoje é código morto)

### Bugs conhecidos (pós-refatoração)

- [ ] Estoque: botões +/- de `inventory` só alteram estado local (sem POST)
- [ ] `webhooks/asaas` — token fraco (<16 chars) só loga, não bloqueia
- [ ] Duplicação `page.tsx` × `TenantSettingsTab` (42%)
- [ ] `loadData` com CCN 44 (brain method)
- [ ] `TenantProvider` é código morto
- [ ] Duplicação `vehicles` × `fleet_vehicles`
- [ ] Rotas de billing sem `allowedRoles` (qualquer role do tenant)

---

## 11. Comandos de referência rápida

### Graphify

```powershell
cd C:\Users\User\eternitysos
graphify update .                 # incremental, sem LLM
graphify cluster-only .           # relatório + comunidades
graphify label . --batch-size 50  # renomear comunidades (Groq)
```

### Git — fluxo por sub-fase

```powershell
git status --short
# ... criar arquivo ...
npx tsc --noEmit
npm run dev
git add <arquivo>
git commit -m "refactor(fase-XX): ..."
```

### Testar

```powershell
npx tsc --noEmit                  # TypeScript
npm run dev                       # dev server em localhost:3000
npx jest                          # testes
```

### Repowise (via Cline)

```
Use repowise__get_health para <arquivo>
Use repowise__get_change_risk para os commits <hash1>, <hash2>
Use repowise__get_dead_code
```

---

## 12. Links úteis

- [Graphify CLI no PyPI](https://pypi.org/project/graphifyy/)
- [Repowise](https://pypi.org/project/repowise/)
- [Groq Console (API keys)](https://console.groq.com/keys)
- [Mermaid Live Editor](https://mermaid.live) — visualizar diagramas
- [Extensão VS Code: Markdown Preview Mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

---

**Fim do registro.** Este arquivo deve ser atualizado ao final de cada fase.