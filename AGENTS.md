<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Idioma
- Responder sempre em português do Brasil (pt-BR).

## Contexto — regras críticas
- **NUNCA** leia arquivos com mais de 500 linhas por inteiro. Use `Get-Content -TotalCount N` ou leia só o trecho relevante.
- **NUNCA** carregue `graphify-out/graph.json` (2.4 MB) no contexto. Consulte via CLI quando precisar.
- **NUNCA** carregue o `GRAPH_REPORT.md` inteiro. Leia só a seção relevante.
- Antes de criar qualquer arquivo, **confirme o escopo** com o usuário em 1 frase. Se não estiver claro, pergunte.

## Graphify (uso sob demanda)
- Ferramenta instalada. O grafo está em `graphify-out/`.
- Para atualizar: `graphify update .` (incremental, sem LLM).
- Para regenerar relatório: `graphify cluster-only .`
- Para renomear comunidades: `graphify label . --backend openai --batch-size 50`
- **Não leia** `graph.json` nem `GRAPH_REPORT.md` inteiros. Use `graphify` CLI.

## Repowise (uso sob demanda via MCP)
- Ferramentas MCP `repowise__*` disponíveis:
  `get_overview`, `get_context`, `get_symbol`, `get_why`,
  `get_change_risk`, `get_risk`, `get_health`,
  `get_dead_code`, `get_answer`, `search_codebase`.
- Use quando o usuário pedir análise de risco, saúde ou código morto.
- **Não chame várias ferramentas na mesma mensagem** — uma por vez.

## Refatoração em andamento
- Objetivo: quebrar o monolito `src/app/page.tsx` (~4942 linhas) em rotas por domínio.
- Fase atual: **2** (Titulares/Dependentes/Contratos). Sub-fases 2a, 2b, 2c concluídas.
- Regra: **copiar, não mover**. `page.tsx` fica intacto até a Fase 6.
- **Nunca alterar** `src/lib/eligibility.ts`, `src/lib/api-handler.ts`, `src/lib/supabaseAdmin.ts`.
- Fluxo por sub-fase: criar arquivo → `npx tsc --noEmit` → testar no browser → commit → `graphify update .`.
- Documentação viva: `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md`.