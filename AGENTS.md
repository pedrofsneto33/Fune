<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Idioma — REGRA INQUEBRÁVEL
- Responder SEMPRE e EXCLUSIVAMENTE em português do Brasil (pt-BR).
- PROIBIDO usar espanhol, inglês ou qualquer outro idioma, mesmo em
  termos comuns. NÃO use: "búsqueda", "autorización", "envía",
  "aguardo", "instrucciones", "corregir", "seleccionado", "ya usa",
  "alineado", "mapeo", "directo", "validación", "instrucciones".
- Se o modelo começar a misturar idiomas, PARE e reescreva em pt-BR.
- Termos técnicos em inglês são aceitos apenas como nomes próprios
  (ex: endpoint, commit, build, deploy), nunca em verbos ou frases.

## Contexto — regras NÃO NEGOCIÁVEIS
- **NUNCA** leia arquivos > 500 linhas por inteiro. Use
  `Select-String -Context` ou `Get-Content -TotalCount N`.
- **NUNCA** carregue `graphify-out/graph.json` (2.4 MB),
  `graphify-out/GRAPH_REPORT.md` ou `graphify-out/graph.html` no
  contexto. Consulte via CLI.
- **NUNCA** leia `src/app/page.tsx` inteiro. Use `Select-String`
  para pegar só trechos.
- **UMA** ferramenta MCP por mensagem. Não chame `get_health` +
  `get_change_risk` + `get_context` juntas.
- Ao terminar uma tarefa, responda **no máximo 10 linhas** + os
  comandos de verificação.

## Economia de tokens (obrigatório)

### Use Graphify antes de ler arquivos
Antes de rodar `Get-Content` ou `Select-String` num arquivo de API,
tente: `/graphify query "quais metodos HTTP e roles existem em <rota>?"`
O grafo já tem a informação. Só leia o arquivo se o grafo não responder.

### Respostas curtas
- Máximo 5 linhas por resposta, exceto quando o usuário pedir
  explicitamente "relatório completo".
- Sem tabelas markdown, sem emojis, sem bullets aninhados.
- Sem repetir o que o usuário já sabe.

### Reconhecimento enxuto
- Máximo 2 arquivos lidos por reconhecimento.
- Máximo 150 linhas totais lidas via Get-Content.
- Use `Select-String -Context` em vez de `Get-Content` inteiro.

### Não usar Repowise em reconhecimento
- Repowise só entra em sub-fases críticas (4c, 5).
- Uma chamada por sub-fase, no máximo.

## Autonomia — quando agir sozinho vs parar
**AJA SOZINHO** (não pergunte) quando:
- O escopo estiver claro no prompt
- Os arquivos-alvo existirem
- O padrão já tiver sido usado em sub-fase anterior

**PARE E PERGUNTE** somente quando:
- O prompt estiver ambíguo (dois caminhos possíveis)
- Um arquivo sensível (`eligibility.ts`, `api-handler.ts`,
  `supabaseAdmin.ts`, `page.tsx`) precisar ser alterado
- Um teste falhar
- Houver conflito de git
- Você estiver em dúvida sobre o formato de uma API

## Fluxo autônomo por sub-fase (siga sem pedir permissão)
Quando o usuário autorizar uma sub-fase, execute TUDO:

1. **Reconhecimento** (só se for sub-fase nova)
   - `Select-String` para mapear APIs e tipos
   - Responda em 4 seções curtas. PARE. (o usuário autoriza a etapa 2)

2. **Execução** (após autorização)
   - Crie os arquivos
   - `npx tsc --noEmit` → se falhar, corrija sozinho (máx 3 tentativas)
   - `npx jest` → se falhar, corrija sozinho
   - `git add` + `git commit -m "refactor(fase-XX): ..."`
   - `graphify update .`
   - `git add graphify-out/` + `git commit -m "chore: atualizar grafo"`
   - Reporte no chat: status + commits + resultado do tsc/jest (máx 10 linhas)

3. **Se o Cline terminar sem erros** → usuário só testa no browser e
   parte para próxima sub-fase.

## Ferramentas — quando usar cada uma

### Graphify (CLI)
- **Sempre** após cada sub-fase: `graphify update .`
- Para blast radius estrutural: `/graphify query "o que quebra se X mudar?"`
- **NUNCA** ler `graph.json`/`GRAPH_REPORT.md` diretamente. Use a CLI.

### Repowise (MCP) — sob demanda, uma por vez
- **Antes de commitar sub-fase crítica (4c, 5):** `repowise__get_change_risk` no commit staged
- **Depois de sub-fase grande:** `repowise__get_health` no arquivo tocado
- **Fase 6 (remover monolito):** `repowise__get_dead_code`
- **Quando não entender código legado:** `repowise__get_why`
- Use **no máximo 1 chamada Repowise por sub-fase**.

## Refatoração — estado atual
- **Objetivo:** quebrar `src/app/page.tsx` (~4942 linhas) em rotas por domínio.
- **Regra de ouro:** copiar, não mover. `page.tsx` fica intacto até a Fase 6.
- **NUNCA alterar:** `src/lib/eligibility.ts`, `src/lib/api-handler.ts`,
  `src/lib/supabaseAdmin.ts`.
- **Documentação viva:** `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md`
  (atualizar ao final de cada fase).

### Fases concluídas
- **Fase 1:** Plans + Sellers
- **Fase 2:** Titulares, Dependentes, Contratos, Import CSV, Tipos (`src/types/domain.ts`)
- **Fase 3:** CRM, Benefícios, Convalescença, Fiscal, Navegação (dropdowns)
- **Fase 4a:** Frota, Estoque
- **Fase 4b:** Tanatopraxia, Capela

### Fase atual: 4c (Service Orders + Burials)
- ✅ **4c-1:** `/ordens` read-only (ServiceOrdersTab)
- ✅ **4c-2a:** `/ordens/nova` (formulário, sem POST)
- ✅ **4c-2b:** POST real conectado + fix `deceased_type` + fix `deceased_id`
  - ⚠️ ATENÇÃO: a API exige `deceased_name`, `deceased_type` E `deceased_id`.
    Para tipo `free`, gerar `deceased_id` sintético (crypto.randomUUID()).
  - Valores válidos de `deceased_type`: `'holder' | 'dependent' | 'free'`
    (NÃO usar titular/dependente/particular).
- ⏳ **4c-3:** botão cancelar OS (PATCH status=cancelled)
- ⏳ **4c-4:** `/sepultamentos` (burials — NÃO usar `/capela`, já existe)
- ⏳ **4c-5:** Links no layout

### Fases pendentes
- Fase 4d: Logística + Emergências
- Fase 5: Cobrança + Financeiro
- Fase 6: Auth/Providers + remover monolito

## Bugs conhecidos (para corrigir após refatoração)
- Estoque: botões +/- de `inventory` só alteram estado local (sem POST)
- Duplicação `vehicles` × `fleet_vehicles` (investigar)
- `TenantProvider` é código morto (consolidar ou remover)
- `deceased_id` obrigatório mesmo para tipo `free` (talvez melhorar API)