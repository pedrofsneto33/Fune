# Jornada: Graphify + Refatoração do `page.tsx`

> Registro cronológico da integração do Graphify ao projeto `eternitysos`
> e das fases de refatoração do monolito `src/app/page.tsx` (~5110 linhas).
>
> **Última atualização:** 2026-09-13
> **Branch atual:** `refactor/fase-2-titulares`
> **Último commit:** `ce5e5ca` (grafo atualizado após 2a e 2b)

---

## 1. Contexto e motivação

O projeto `eternitysos` (ERP funerário multi-tenant em Next.js 16 + React 19 + Supabase)
tem um monolito frontend de **~5110 linhas** em `src/app/page.tsx` que concentra:

- Autenticação e estado do tenant
- Fetching direto ao Supabase de ~10 tabelas
- Autorização por aba (`isTabAllowed`)
- Renderização de 6 tabs + 6 modais

**Objetivo da refatoração:** quebrar esse monolito em rotas separadas por domínio,
seguindo o padrão **Strangler Fig** (construir o novo em paralelo, remover o antigo depois).

**Objetivo do Graphify:** ter um **mapa real do código** (grafo de símbolos) para
medir blast radius de cada mudança antes de executá-la.

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

### Estado final do grafo

| Métrica | Valor (após 2a + 2b) |
|---|---|
| Nós | 3385 |
| Arestas | 4799 |
| Comunidades | 370 |
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

## 3. Plano de refatoração — 6 fases + 5 sub-fases

### Fases macro (por risco crescente)

| Fase | Escopo | Status |
|---|---|---|
| **1** | Plans + Sellers (abas folha) | ✅ Na main (`2ed010d`) |
| **2** | Titulares + Dependentes + Contratos | 🚧 Em andamento |
| **3** | CRM + Benefícios + Fiscal | ⏳ Pendente |
| **4** | Serviço funerário (OS, capela, tanatopraxia) | ⏳ Pendente |
| **5** | Cobrança + Financeiro | ⏳ Pendente |
| **6** | Auth + Providers (o alicerce) | ⏳ Pendente |

### Fase 2 — sub-fases

| Sub-fase | Escopo | Risco | Status |
|---|---|---|---|
| **2a** | Leitura `/titulares` (quick-search + GET holders) | 🟢 Baixo | ✅ `e8ed41d` |
| **2b** | CRUD `/dependentes` | 🟢 Baixo | ✅ `dcdf728` |
| **2c** | Import CSV `/titulares/importar` | 🟢 Baixo | ⏳ Próxima |
| **2d** | `/contratos` + elegibilidade | 🟡 Médio | ⏳ |
| **2e** | Extrair tipos para `src/types/` | 🟠 Médio-alto | ⏳ |

---

## 4. Blast radius medido pelo Graphify

| Fase / Sub-fase | Nós seed | Nós 1-hop | Arestas |
|---|---|---|---|
| Fase 1 (executada) | 26 | 46 | 78 |
| **Fase 2 inteira** | **40** | **79** | **169** |
| 2a | ~12 | ~12 | ~20 |
| 2b | ~15 | ~15 | ~30 |
| 2c | ~8 | ~8 | ~15 |
| 2d | ~20 | ~20 | ~45 |
| 2e | ~30 | ~30 | ~60 |

**Insight crítico:** a Fase 2 tem **~2× o blast radius da Fase 1** porque contratos/titulares
são consumidos por **8 módulos de cobrança/serviço** (asaas-batch, pix, boleto,
generate-cycles, payment-carnets, service-orders, convalescence, page.tsx).

**`eligibility.ts` é intocável nesta fase.** Mudar a assinatura de qualquer um dos
seus 8 símbolos quebra produção. A regra é **consumir, nunca alterar**.

---

## 5. Padrões e decisões estabelecidas

### 5.1 Opção A — Copiar, não mover

**Regra:** em cada sub-fase, criar rota nova **copiando** lógica do `page.tsx`,
sem modificar `page.tsx`. Duplicação temporária é aceitável; divergência não.

- ✅ `page.tsx` permanece 100% intacto (diff zero)
- ✅ Rota nova é independente
- ✅ Rollback = deletar a pasta nova
- ⚠️ Duplicação existe até a sub-fase 2e

### 5.2 Prompts para IA — padrão "mecânico"

Quando for inevitável usar IA no Cline:

1. **Desativar o Graphify temporariamente:**
   ```powershell
   Rename-Item "AGENTS.md" "AGENTS.md.bak"
   ```
   (impede o Cline de carregar `graph.json` de 2.4MB no contexto)

2. **Colar o código pronto** no prompt, não pedir para a IA criar do zero

3. **Restringir a resposta** ("responda apenas com git status")

4. **Ponto de parada explícito** ("se falhar, diga FALHEI")

5. **Restaurar ao final:**
   ```powershell
   Rename-Item "AGENTS.md.bak" "AGENTS.md"
   ```

### 5.3 Fluxo por sub-fase

```
1. git switch refactor/fase-2-titulares
2. git status --short  → deve estar limpo
3. Criar arquivo novo (manual ou IA com código pronto)
4. npx tsc --noEmit    → sem erros
5. npm run dev         → teste manual no browser
6. git add + git commit -m "refactor(fase-2X): ..."
7. graphify update .   → atualiza grafo
8. git add graphify-out/ + git commit -m "chore: atualizar grafo..."
```

---

## 6. Aprendizados sobre IA (Solar Pro 4)

**Modelo que NÃO serve para refatoração de código:**
- Upstage Solar Pro 4 (via Cline)

**Sintomas observados:**
- Loop infinito de "Resposta final" (100+ linhas repetidas)
- Alucinação de arquivos criados que nunca existiram
- Corrupção de encoding (`Cônjuge` → `CÃ´njuge`)
- Picar funções em pedaços e remontar fora de ordem
- Imports corrompidos: remover `@` de `@/lib/...`
- Inserir anotações inválidas (`(see below for file content)`)

**Modelos recomendados:**
- **DeepSeek** (pago, barato, estável) — preferido
- **Groq `openai/gpt-oss-120b`** (grátis, com TPM 8000)
- **Claude Sonnet** (pago, excelente)

**Regra prática:** para CRUDs simples e refatorações mecânicas, **manual é mais rápido que IA**.

---

## 7. Commits e histórico

### Branch `refactor/fase-2-titulares`

```
ce5e5ca (HEAD) chore: atualizar grafo apos 2a e 2b (3385 nos, 4799 arestas)
dcdf728        refactor(fase-2b): criar rota /dependentes (CRUD)
e8ed41d        refactor(fase-2a): criar rota /titulares (leitura de associados)
2ed010d (main) chore: atualizar grafo apos refatoracao da fase 1
2ead6c6        chore: ignorar cache e snapshots do Graphify
137b9bc        chore: remover cache do Graphify do versionamento
d4bed45        refactor(fase-1): migrar Plans e Sellers para route group
2abc6e5        chore: adicionar Graphify (grafo, relatório e integração com Cline)
49f53a5        fix: F-16 authFetch fail-closed (ponto de partida)
```

### Branch `main`
- **Local:** `2ed010d` (com Fase 1)
- **Remota (`origin/main`):** `2ed010d`

---
### Branch `refactor/fase-3-crm-fiscal` (mergeada na main)

Fase 3 — CRM + Benefícios + Convalescença + Fiscal + Navegação:

- 3a: rota /crm (CrmTab envelopado)
- 3b: link /crm no layout
- 3c-1: rota /beneficios (BenefitsTab novo — 274 linhas)
- 3c-2: rota /convalescencia (ConvalescenceTab novo — 336 linhas)
- 3d: rota /fiscal (FiscalTab envelopado)
- 3e: navegação completa com dropdowns agrupados

Total: 12 commits (6 refactors + 6 grafo).
Todos os 145 testes passando ao final.
## 8. Artefatos gerados

| Arquivo | Tamanho | Descrição |
|---|---|---|
| `graphify-out/graph.json` | ~2.4 MB | Grafo técnico (3385 nós) |
| `graphify-out/GRAPH_REPORT.md` | ~36 KB | Relatório legível |
| `graphify-out/graph.html` | ~2 MB | Visualização interativa |
| `docs/GRAPHIFY.md` | ~604 linhas | Documento manual escrito pelo Cline |
| `AGENTS.md` | — | Instruções para agentes de IA |
| `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md` | este arquivo | Registro cronológico |

---

## 9. Próximos passos

### Curto prazo
- [ ] **2c** — Import CSV em `/titulares/importar`
- [ ] **2d** — `/contratos` + painel de elegibilidade
- [ ] **2e** — Extrair tipos `Holder`/`Dependent`/`Contract` para `src/types/`

### Médio prazo
- [ ] Merge `refactor/fase-2-titulares` → `main` (após 2e)
- [x] **Fase 3** — CRM + Benefícios + Fiscal ✅ (mergeada na main)
- [ ] **Fase 4** — Serviço Funerário (OS, capela, tanatopraxia, logística)
- [ ] **Fase 4** — Serviço funerário
- [ ] **Fase 5** — Cobrança + Financeiro
- [ ] **Fase 6** — Auth + Providers

### Longo prazo
- [ ] Remover `page.tsx` monolítico (após Fase 6)
- [ ] Consolidar `TenantProvider` (hoje é código morto)
- [ ] Investigar duplicação `vehicles` × `fleet_vehicles`

---

## 10. Comandos de referência rápida

### Graphify
```powershell
cd C:\Users\User\eternitysos
graphify update .                 # incremental, sem LLM
graphify cluster-only .           # relatório + comunidades
graphify label . --batch-size 50  # renomear comunidades (Groq)
```

### Git — fluxo por sub-fase
```powershell
git switch refactor/fase-2-titulares
git status --short
# ... criar arquivo ...
npx tsc --noEmit
npm run dev
git add <arquivo>
git commit -m "refactor(fase-2X): ..."
```

### Testar
```powershell
npx tsc --noEmit                  # TypeScript
npm run dev                       # dev server em localhost:3000
npm test                          # se houver testes
```

### Cline (quando inevitável)
```powershell
Rename-Item "AGENTS.md" "AGENTS.md.bak"   # antes
# ... usar o Cline ...
Rename-Item "AGENTS.md.bak" "AGENTS.md"   # depois
```

---

## 11. Links úteis

- [Graphify CLI no PyPI](https://pypi.org/project/graphifyy/)
- [Groq Console (API keys)](https://console.groq.com/keys)
- [Mermaid Live Editor](https://mermaid.live) — para visualizar diagramas
- [Extensão VS Code: Markdown Preview Mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

---

**Fim do registro.** Este arquivo deve ser atualizado a cada sub-fase concluída.