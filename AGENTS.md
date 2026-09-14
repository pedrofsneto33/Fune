<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Idioma
- Responder SEMPRE em português do Brasil (pt-BR).

## Contexto — regras NÃO NEGOCIÁVEIS
- **NUNCA** leia arquivos > 500 linhas por inteiro. Use `Select-String -Context` ou `Get-Content -TotalCount N`.
- **NUNCA** carregue `graphify-out/graph.json` (2.4 MB), `graphify-out/GRAPH_REPORT.md` ou `graphify-out/graph.html` no contexto. Consulte via CLI.
- **NUNCA** leia `src/app/page.tsx` inteiro. Use `Select-String` para pegar só trechos.
- **UMA** ferramenta MCP por mensagem. Não chame `get_health` + `get_change_risk` + `get_context` juntas.
- Ao terminar uma tarefa, responda **no máximo 10 linhas** + os comandos de verificação.

## Autonomia — quando agir sozinho vs parar
**AJA SOZINHO** (não pergunte) quando:
- O escopo estiver claro no prompt
- Os arquivos-alvo existirem
- O padrão já tiver sido usado em sub-fase anterior

**PARE E PERGUNTE** somente quando:
- O prompt estiver ambíguo (dois caminhos possíveis)
- Um arquivo sensível (`eligibility.ts`, `api-handler.ts`, `supabaseAdmin.ts`, `page.tsx`) precisar ser alterado
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

3. **Se o Cline terminar sem erros** → usuário só testa no browser e parte para próxima sub-fase.

## Ferramentas — quando usar cada uma

### Graphify (CLI)
- **Sempre** após cada sub-fase: `graphify update .`
- Para blast radius estrutural: `/graphify query "o que quebra se X mudar?"`
- **NUNCA** ler `graph.json`/`GRAPH_REPORT.md` diretamente. Use a CLI.

### Repowise (MCP) — sob demanda, uma por vez
- **Antes de commitar sub-fase crítica (2d, 3d, 5):** `repowise__get_change_risk` no commit staged
- **Depois de sub-fase grande:** `repowise__get_health` no arquivo tocado
- **Fase 6 (remover monolito):** `repowise__get_dead_code`
- **Quando não entender código legado:** `repowise__get_why`
- Use **no máximo 1 chamada Repowise por sub-fase** para não estourar contexto.

## Refatoração — estado atual
- **Objetivo:** quebrar `src/app/page.tsx` (~4942 linhas) em rotas por domínio.
- **Regra de ouro:** copiar, não mover. `page.tsx` fica intacto até a Fase 6.
- **NUNCA alterar:** `src/lib/eligibility.ts`, `src/lib/api-handler.ts`, `src/lib/supabaseAdmin.ts`.
- **Documentação viva:** `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md` (atualizar ao final de cada fase).

### Fases concluídas
- Fase 1: Plans + Sellers (na main)
- Fase 2: Titulares, Dependentes, Contratos, Import CSV, Tipos (`src/types/domain.ts`)
- Fase 3: CRM + Benefícios + Convalescença + Fiscal (em andamento)

### Sub-fases pendentes da Fase 3
- 3a: /crm (CrmTab envelopado) — em execução
- 3b: link no layout + CRUD (a definir)
- 3c: Benefícios + Convalescença
- 3d: Fiscal (FocusNFE)