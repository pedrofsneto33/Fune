# ETERNITYOS - ROADMAP E PENDENCIAS (memoria de sessao)

> **REGRA PERMANENTE (ordem do usuário):** TODA comunicação, código, comentários,
> UI, commit messages e documentação devem estar em **PORTUGUÊS DO BRASIL**.
> Nunca responder nem escrever código em espanhol ou outro idioma.
> Esta regra vale para todas as sessões futuras.

> Manutenção: atualizar sempre que concluir um item.

> **Última atualização:** 2026-09-18

## 1. AGENTE DE TRIAGEM WHATSAPP (Evolution API) - MODULO EXTRA (COBRADO À PARTE)

> **Decisao de negocio:** Implementacao do painel WhatsApp sera cobrada como modulo extra.
> Backend ja esta pronto. Frontend sera implementado quando cliente contratar.

### Ja feito (backend completo, commit `ed3b35b`)
- [x] `src/lib/whatsappAgent.ts` — maquina de estado (triagem em 3 passos: nome falecido → local → contato família)
- [x] `src/app/api/webhooks/whatsapp/route.ts` — recebe mensagens da Evolution API
- [x] `src/app/api/emergency-dispatches/route.ts` — lista/cria chamados de emergencia
- [x] `scripts/agente-whatsapp.sql` — tabelas: emergency_dispatches, whatsapp_agent_sessions, tenant_whatsapp_numbers
- [x] .env.example atualizado com EVOLUTION_API_URL / EVOLUTION_API_KEY / WHATSAPP_WEBHOOK_TOKEN
- [x] SQL ja rodado no Supabase

### Falta (quando cliente contratar o modulo)
- [ ] **Painel Plantao 24h** (frontend): aba com lista de chamados do bot, status (Aguardando veículo, Em atendimento, Concluído), ações de PATCH status
- [ ] **Formulario "Conectar WhatsApp"** (frontend): tela nas Configuracoes da Empresa pra registrar numero + evolution_instance
- [ ] **Infra do cliente** (manual): instalar Evolution API (Docker/VPS), criar instancia, conectar numero, apontar webhook pra `https://eternityos.vercel.app/api/webhooks/whatsapp`, setar envs na Vercel

### Infra necessaria (por conta do cliente)
- VPS (DigitalOcean, ContaCloud, etc.) ~R$ 30-50/mês
- Chip dedicado pro WhatsApp ~R$ 10-20/mês
- Evolution API (gratuito, open-source)

## 2. TEMA CLARO (dark/light) - CONCLUIDO

### Feito (commit `04a1727`, no GitHub)
- [x] `tailwind.config.js` → `darkMode: 'class'`
- [x] `src/components/ThemeToggle.tsx` — alternador com persistência no localStorage
- [x] `src/app/layout.tsx` — script anti-flash (CSP-safe) + classe `dark` via `<script>` inline (default dark para nao mudar a experiencia atual) + Toaster `theme="system"`
- [x] `src/app/globals.css` — variáveis CSS `--background/--foreground` para claro/escuro + scrollbar adaptativa + transicao 0.2s
- [x] `scripts/convert-theme.js` — script idempotente (lookbehind `(?<![\w:])`) que converte classes dark-only (bg-zinc-950 → bg-slate-50 dark:bg-zinc-950, text-white → text-slate-900 dark:text-white) preservando cor de botoes coloridos
- [x] `tsc --noEmit` OK; `next build` compilou OK (3.3s)
- [x] Default: escuro (nao altera UX atual); usuarios escolhem claro via toggle

## 3. NFS-e (Nota Fiscal de Servico) - FOCUSNFe IMPLEMENTADO (commit `33d0f09`)

### FASE 1 - Estrutura ✅ CONCLUIDA
- [x] Tabela `public.fiscal_invoices` - historico completo de tentativas, com isolamento por tenant
- [x] Colunas Reforma Tributaria (IBS/CBS) ja criadas
- [x] RLS com isolamento por tenant
- [x] Indices para performance
- [x] Colunas em `service_orders`: `nfse_id`, `nfse_status`, `nfse_required`
- [x] Colunas de config em `tenants`: provedor, env, api_key, CNPJ, endereco, IBGE, CNAE, regime, codigo servico, aliquota ISS, auto_emit
- [x] Migration `scripts/nfse_migration.sql` — **RODADA NO SUPABASE** ✅

### FASE 2 - Provedor escolhido: **FocusNFe** ✅
- [x] `src/lib/fiscal/focusnfe.ts` — 4 funcoes (emit, get, cancel, test) com Basic Auth estrito
- [x] 5 rotas de API: `/api/fiscal/emit`, `/api/fiscal/cancel`, `/api/fiscal/list`, `/api/fiscal/config`, `/api/fiscal/test`
- [x] `src/components/tabs/FiscalTab.tsx` — aba "📄 Fiscal (NFS-e)" com cards, tabela, modal de cancelamento
- [x] `src/components/tabs/FiscalSettingsSection.tsx` — formulario completo em Configurações da Empresa
- [x] Integração no menu lateral e header
- [x] `focusnfeGet` documentado como API publica (par de emit/cancel; nao e dead code)

### FASE 3 - Aguardando habilitação externa ⏳
- [ ] **FocusNFe precisa habilitar o CNPJ da funerária** (email já foi enviado pedindo)
- [ ] Sandbox não disponível para Teresina (PI) — limitação da prefeitura (provedor Dsf)
- [ ] Teste em produção com valor baixo + cancelamento (recomendação da FocusNFe)
- [ ] ⚠️ **REVOGAR TOKEN ANTES DE ATIVAR O SERVIÇO FocusNFe.**
      Token de produção abaixo está **público neste repo desde 02/09/2026**.
      Gerar novo no painel FocusNFe no dia da ativação. Token antigo:
> ⚠️ **ATENCAO: este token esta publico neste repo desde 02/09/2026.**
> **REVOGAR NO PAINEL FOCUSNFE ANTES DE ATIVAR O SERVICO.**
> Gerar novo token no dia da ativacao e remover este bloco.
- [ ] Token de producao antigo (PENDENTE DE REVOGACAO): `7TaSTZhSJ9A2opektRmqDwSKCiFHeNZs`

## 4. CRM DE LEADS / PIPELINE — MVP IMPLEMENTADO (commit `567de2d`)

### Feito (CRM interno do OPERADOR — vender o próprio SaaS)
- [x] Tabela `public.leads` (`scripts/crm_leads_migration.sql`) — SEM tenant_id
      por design: leads são prospects de venda do sistema, não dados de funerária.
      RLS ativada sem policies (só service role).
- [x] `src/lib/crm.ts` — fonte única de estágios/origens + nextLeadStage + waLink.
- [x] `GET/POST/PATCH/DELETE /api/leads` — withAuth superadmin, rate limit, sanitização.
- [x] `POST /api/leads/landing` — PÚBLICO p/ captação da landing page: rate limit
      por IP (5/5min) + honeypot anti-bot + sanitização. Allowlist atualizada nos
      testes de segurança (routes-auth/routes-tenant) documentando as exceções.
- [x] Aba "🎯 CRM (Vendas)" — SÓ superadmin (gated direto, fora do isTabAllowed):
      funil em 6 colunas (novo→contato→demo→proposta→ganho/perdido), KPIs
      (leads no funil, follow-ups atrasados, fechados, MRR estimado), WhatsApp
      1 clique (wa.me com DDI), avançar/perder estágio, exclusão em 2 cliques.
- [x] Landing page: seção "Quer ver o sistema funcionando?" → lead cai direto no funil.
- [x] Testes: `tests/lib/crm.test.ts` (fluxo, validadores, waLink) — 108 testes verdes.

### Falta (evolução do CRM)
- [x] Botão "🚀 Virar Cliente" no lead ganho → criar tenant da funerária
      (integrar com POST /api/tenants) + marcar conversão com `converted_at` /
      `converted_tenant_id` (migration `scripts/crm_leads_conversion.sql` —
      RODAR no Supabase) + badge "✓ Cliente" + KPI "Clientes convertidos".
- [x] Edição de lead (botão "✏️ Editar" abre modal com todos os campos; PATCH
      suporta name, company, city, uf, phone, email, source, estimated_monthly,
      next_follow_up, notes).
- [x] Histórico de interações por lead (tabela lead_notes) em vez de só campo notes.
      Tabela `lead_notes` (migration `scripts/crm_lead_notes.sql` — RODAR no
      Supabase) + API GET/POST/DELETE `/api/lead-notes` (superadmin) + botão
      "📋 Hist." em cada card com modal de historial (listar + añadir + eliminar
      con confirmación).

## 5. TRANSMISSAO AO VIVO - ADIADO (decisao de roadmap)

- [ ] Cortado do roadmap atual. Exige infra de streaming (custo).

## 6. BUSCA + CADASTRO DE TITULARES (Novo) - CONCLUIDO

### Busca de Associados (Demanda do usuario)
- [x] Problema: a busca no `/holders` só batia CPF formatado e `phone` sem
      normalização, então nome/WhatsApp sem formatação não encontravam.
- [x] Corrigido em `src/app/page.tsx` (filteredHolders): normaliza acentos (NFD),
      remove não-numéricos do phone (como faz no CPF) e expande para Cidade/UF.
      Agora busca por **nome (com/sem acento), CPF, WhatsApp, Cidade, UF**.
- [x] `next build` OK.

### Formulario "Novo Titular" + API
- [x] Formulario enriquecido (`page.tsx`, `holderForm` + JSX): campos
      **Cidade, UF, Data Nascimento, Gênero (select), Observações** — todos
      com direcionamento preciso via API (`POST/PATCH /api/holders`).
- [x] `src/app/api/holders/route.ts`: parse + insert dos novos campos com
      **retry defensivo** (se a coluna nao existir no DB, refaz insert sem
      extras) -> cadastro de titular nunca quebra.
- [x] Migration `scripts/holders-enrich-columns.sql` (ADD COLUMN IF NOT EXISTS,
      idempotent) para rodar no Supabase SQL Editor.
- [x] Interface `Holder` tipada com os novos campos.

## 7. PENDÊNCIAS TÉCNICAS / FOLLOW-UP (memoria de sessao)

### A. Dependentes via API server (hardening) — VERIFICAR
- [ ] **ATUALIZAÇÃO 2026-09-18:** o monólito `src/app/page.tsx` foi removido
      (Fase 6g-6d). A home hoje é `src/app/(dashboard)/page.tsx` com ~83 linhas.
      Confirmar se `handleAddDep` (browser client) ainda existe em outro lugar
      ou se já foi migrado para `authFetch`.
- [ ] Confirmar se `/api/dependents/route.ts` (rota server-side) já cobre
      POST/PATCH/DELETE com `supabaseAdmin`.
- [ ] Rodar `scripts/holders-enrich-columns.sql` no Supabase se ainda não rodou
      (cidade/uf/birth_date/gender/observations).

### B. Revisão visual do theme claro
- [ ] Validar estilos de `select`, `input[type=date]`, e botões coloridos
      (text-white preservado) em modo claro — ajustes manuais se houver
      contraste baixo.
- [ ] Garantir que o ThemeToggle apareça em mobile (header collapsado).

### C. Agente WhatsApp (continua em andamento)
- [ ] Painel Plantão 24h: listar chamados (GET /api/emergency-dispatches) + PATCH status.
- [ ] Formulário "Conectar WhatsApp" nas Configurações (gravar `tenant_whatsapp_numbers`).
- [ ] Infra do cliente: instalar Evolution API (Docker/VPS) + webhook Vercel env vars.

### D. NFS-e — Gateway ESCOLHIDO (ver Seção 3)
- [x] Gateway escolhido: **FocusNFe** (implementado, commit `33d0f09`).
- [x] Rotas `/api/fiscal/*` + tabela `fiscal_invoices` criadas.
- [ ] ⚠️ Aguarda habilitação do CNPJ pela FocusNFe (email enviado).
- [ ] ⚠️ REVOGAR token antigo ao ativar (está público no repo — ver Seção 3).
- [ ] Prazo: IBS/CBS obrigatório a partir de out/2026.

### E. Migrations não versionadas (SQLs soltos em scripts/)

- [ ] **PROBLEMA:** vários SQLs aplicados manualmente no remoto via
      SQL Editor nunca foram movidos para `supabase/migrations/`.
      Consequência: quem clonar o repo e rodar migrations do zero
      NÃO tem essas tabelas/colunas — rotas quebram em ambiente novo.
- [ ] Evidência: `lead_notes` existe no remoto mas NÃO aparece no
      `src/types/supabase.ts` regenerado do banco local (schema
      divergente).
- [ ] SQLs candidatos (mover pra `supabase/migrations/` com timestamp
      retroativo quando possível):
      - `scripts/crm_leads_migration.sql` (tabela `leads`)
      - `scripts/crm_leads_conversion.sql` (colunas converted_at,
        converted_tenant_id)
      - `scripts/crm_lead_notes.sql` (tabela `lead_notes`)
      - `scripts/holder-enrich-columns.sql` (cidade/uf/birth_date/
        gender/observations em holders)
      - `scripts/webhook_events_migration.sql` (tabela webhook_events)
      - `scripts/webhook_events_retry.sql` (colunas retry_count,
        last_retried_at, retry_error)
      - `scripts/agente-whatsapp.sql` (emergency_dispatches,
        whatsapp_agent_sessions, tenant_whatsapp_numbers)
      - `scripts/nfse_migration.sql` (fiscal_invoices + colunas fiscal
        em tenants/service_orders)
- [ ] Ação: rodar `npx supabase db reset` no local e verificar quais
      SQLs fazem falta; mover 1 por vez pra `supabase/migrations/`
      com commit separado; validar `npx tsc --noEmit` a cada um.
- [ ] Prioridade: MÉDIA (não bloqueia produção; bloqueia onboarding
      de outro dev ou recriação do ambiente).

### F. Consolidacao vehicles × fleet_vehicles (Fase 14)

- [ ] **NAO SAO DUPLICATAS.** Sao 2 tabelas paralelas com
      propositos distintos:
      - `vehicles`: frota operacional (service-orders, dispatches)
      - `fleet_vehicles`: frota do bot WhatsApp + despesas (emergency_dispatches, fleet_expenses)
- [ ] Dados disjuntos: `vehicles` tem 1 registro (ABC-1234),
      `fleet_vehicles` tem 3 (FUN-2040, ATD-3050, PIX-1001).
      Zero plates em comum.
- [ ] FKs: `dispatches.vehicle_id` e `service_orders.vehicle_id`
      apontam para `vehicles`; `emergency_dispatches.vehicle_id` e
      `fleet_expenses.vehicle_id` apontam para `fleet_vehicles`.
- [ ] Codigo usa `vehicles` em 7 lugares (service-orders 6 +
      dispatches/close 1); `fleet_vehicles` **0 refs diretas**
      (so via FK).
- [ ] **Consolidacao (Fase 14):** migrar 3 registros de
      `fleet_vehicles` para `vehicles`, repointar 4 FKs, unificar
      formatos (status uppercase vs lowercase, plate text vs
      varchar), atualizar `emergency_dispatches` e `fleet_expenses`
      para usar `vehicles`. Drop `fleet_vehicles` ao final.
- [ ] **Prioridade: BAIXA.** Nao bloqueia producao; tabelas
      coexistem sem conflito. Fazer quando tocar em frota por
      outro motivo.
- [ ] **Risco de drop prematuro:** `emergency_dispatches` (bot
      WhatsApp) e `fleet_expenses` (financeiro) perdem vinculo
      de frota.

## 8. VENDAS AVULSAS — MELHORIAS PENDENTES (anotado pelo usuario em 2026-09)

> Contexto: painel "💰 Vendas Avulsas" ja existe na aba Financeiro (commit `aed3fd2`).
> Fonte dos dados: `financial_transactions` com categoria fixa **"Serviço Funeral Avulso"**,
> gravada por `POST /api/billing/avulso` (commit `31a1fb4`).

- [ ] **Filtro por período no painel Vendas Avulsas** — seletor de data (início/fim)
      no painel da aba Financeiro; idealmente aceitar `?from=&to=` no
      `GET /api/financial/transactions` (hoje a rota nao aceita filtros, so limit 500)
      e o painel passar a fazer fetch proprio em vez de derivar do estado global.
- [ ] **Exportar a lista de vendas avulsas em CSV/PDF** — botao no painel; CSV pode
      ser gerado client-side (Blob + download); PDF reutilizar o padrao de
      `src/lib/pdf-report.ts`/`printReports.ts` ja usado no projeto.
- [ ] **Rastreabilidade OS ↔ venda avulsa** — criar coluna `service_order_id UUID
      REFERENCES service_orders(id)` em `financial_transactions` (migration no
      Supabase) + gravar o vinculo no insert da `/api/billing/avulso` (a rota ja
      aceita `service_order_id` no body e valida tenant, mas hoje so inclui o id
      na descricao do lancamento, nao na coluna) + exibir link/OS no painel.

## 9. ARQUITETURA — EXECUTADO (commit `4fd38fd`) E PENDENTE

### Fonte unica de receita — FEITO
- [x] `src/lib/financial.ts` — `recordIncome()` é a ÚNICA porta de escrita de
      receita em `financial_transactions` (valida valor, trunca categoria p/ 50,
      nunca lança, prefixa origem na descrição: `[asaas_webhook]`, `[payment_carnets]`,
      `[billing_avulso]`).
- [x] Refatorados: webhook Asaas, carnê PATCH 'pago', billing/avulso.
- [x] AUDITORIA: `webhook_events` registra TODO evento do Asaas com payload +
      processed/skipped_reason. Código com degradação graciosa.
- [x] TESTES: `tests/lib/eligibility.test.ts` + `tests/lib/financial.test.ts`.

### AÇÃO MANUAL: rodar `scripts/webhook_events_migration.sql` no Supabase
- [ ] Sem a tabela, a auditoria fica desligada (o webhook NÃO quebra, só não audita).

### Pendente (próximas sessões, nesta ordem)
- [x] ~~**useBilling — extrair handlers do monólito page.tsx**~~ **FEITO**: o
      monólito `src/app/page.tsx` foi removido na Fase 6g-6d; a home hoje é
      `src/app/(dashboard)/page.tsx` com ~83 linhas. Rotas por domínio já
      existem (`/titulares`, `/dependentes`, `/contratos`, `/vendas/nova`, etc.).
      Extração incremental aconteceu naturalmente durante as fases 1-13.
- [ ] **Dependentes via API server** (pendência antiga, seção 7A — VERIFICAR em
      2026-09-18): confirmar se ainda existe fluxo de escrita fora do padrão
      server-side no sistema.
- [ ] **Rastreabilidade Asaas ↔ carnê**: persistir `asaas_payment_id` de cada
      parcela nas linhas de `payment_carnets` (hoje os IDs só voltam na resposta
      HTTP; se o usuário fecha a tela, a parcela fica 'pendente' eterna mesmo
      paga). Requer migration (coluna nova) + update pós-criação no Asaas.
- [x] **Agregação no backend** — FEITO: `GET /api/financial/summary`
      (totais + série mensal + vendas avulsas, paginação sem teto de 500);
      `GET /api/financial/transactions` aceita `?from=&to=&type=&category=&limit=`;
      painel Vendas Avulsas com fetch próprio por período; totais/serie com
      fallback client-side se o resumo falhar.
- [x] Tabela de eventos: retry manual de webhooks (commit `9009a67`):
      migration `scripts/webhook_events_retry.sql` (retry_count, last_retried_at,
      retry_error), rotas GET /api/webhooks/events + POST /api/webhooks/retry,
      modal `ModalWebhookRetry.tsx` com filtros e botão Reenviar.

## 10. SEGURANÇA — CONCLUÍDO (2026-09-18)

> Sessão intensiva de hardening. Vários itens fechados.

### Fechados
- [x] **SUPABASE_SERVICE_ROLE_KEY rotacionada** — chave vazada no histórico
      do git foi invalidada. JWT Legacy HS256 revogado no painel Supabase.
      Migração para chaves novas (`sb_publishable_` / `sb_secret_`).
- [x] **Duplicata de webhook token corrigida** — 3 tenants compartilhavam
      o mesmo `asaas_webhook_token` (Matriz + 2 QAs). QAs tiveram token anulado.
- [x] **11e completa** — enforcement de token Asaas:
      * webhook `<16` chars → 401 + logError
      * `PATCH /api/tenants` `<16` → 400
      * PATCH com vazio → limpa coluna (null)
- [x] **Fase A/B do hash** — `asaas_webhook_token` em plaintext foi removido;
      lookup agora usa `asaas_webhook_token_hash` (SHA-256).
- [x] **Rate limiter fixado** — o Ratelimit de produção ignorava o config do
      chamador (`slidingWindow(10,'60s')` fixo). Agora respeita
      `maxAttempts`/`windowMs`.
- [x] **Hardening superadmin global (4d)**:
      * `user_roles.is_global boolean NOT NULL DEFAULT false`
      * `is_superadmin()` agora exige `role='superadmin' AND is_global=true`
      * `withAuth` ganhou `opts.requireGlobal` que só aceita `is_global=true`
      * Aplicado em `/api/saas/{tenants,subscribe,cancel}`
- [x] **api-handler refatorado** — CCN 27 → ~10, extraídos 3 helpers
      (`checkRequireGlobal`, `checkRoleAllowed`, `checkSaasGate`) + 10 testes
      dedicados de caracterização.
- [x] **SaaS gate de enforcement (3)** — bloqueia POST/PATCH/DELETE quando
      assinatura SaaS está `suspended`/`blocked`. Cálculo lazy (sem cron).
- [x] asaas_api_key em plaintext: criptografada via Supabase Vault
      (A-1+A-2). Codigo le via RPC get_asaas_api_key. Fase B
      (dropar coluna plaintext) marcada para 1-2 semanas apos
      validacao em prod.

### Pendentes (aceitos como dívida honesta)
- [ ] **`asaas_api_key` em plaintext** no banco — mesma solução da Fase A
      precisa ser aplicada (hash ou AES). Última dívida de segurança de dado
      sensível que resta.
- [ ] **Token FocusNFe exposto** em `docs/ROADMAP-PENDENTES.md` — decisão:
      revogar antes de ativar o serviço (ver Seção 3).
- [ ] **`vehicles` × `fleet_vehicles` duplicadas** — sem uso crítico hoje.
- [ ] **`supabaseAdmin` sem tipo `<Database>`** — todos os casts `as X` nas
      queries existem por conta disso. Tipar destrava type-safety mas afeta
      ~60 rotas. Fase própria.

## 11. SAAS BILLING — COMPLETO (2026-09-18)

> Painel admin + integração Asaas + gate de enforcement + modais.

### Fases entregues
- [x] **Fase 1** — Schema: `saas_subscriptions` + `saas_webhook_events` (migration
      `20260918000000`)
- [x] **Fase 2** — Lib `src/lib/asaasSaas.ts` + 4 rotas `/api/saas/{subscribe,cancel,subscription,tenants}`
      + webhook dedicado `/api/webhooks/asaas-saas`
- [x] **Fase 3a** — `src/lib/saas-gate.ts` (funções puras: active/past_due/suspended/blocked)
      + 23 testes
- [x] **Fase 3b** — Gate server em `withAuth` (bloqueia mutações quando suspenso)
- [x] **Fase 3c** — Banner `SaasBanner` + redirect pra `/assinatura-suspensa`
- [x] **Fase 4a** — Endpoint `GET /api/saas/tenants` (lista + KPIs MRR/inadimplentes)
- [x] **Fase 4b** — Painel `/admin/saas` (tabela + KPIs + filtro)
- [x] **Fase 4c** — Modais criar/cancelar assinatura
- [x] **Fase 4d-1** — Migration `is_global` em `user_roles`
- [x] **Fase 4d-2** — `withAuth` exige `is_global` em rotas SaaS

### Configuração manual
- [x] `SAAS_WEBHOOK_TOKEN` configurado na Vercel
- [ ] Configurar webhook no painel Asaas apontando pra
      `https://eternityos-git-main-ebookall.vercel.app/api/webhooks/asaas-saas`
      (no dia da ativação)

## 12. OBSERVABILIDADE — SENTRY (2026-09-18)

- [x] `@sentry/nextjs` 10.75.0 instalado
- [x] `src/instrumentation.ts` (server + edge)
- [x] `src/instrumentation-client.ts` (browser)
- [x] `src/app/global-error.tsx` + `src/app/error.tsx`
- [x] CSP do middleware libera `*.sentry.io` + `*.ingest.sentry.io`
- [x] `.env.example` + Vercel configurados (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`)
- [ ] Smoke test end-to-end (rota `/api/__sentry-test` foi revertida por
      problema de folder privada; testar quando precisar validar captura)

## 13. LGPD — CONCLUÍDO (2026-09-18)

- [x] `/termos` — Termos de Uso
- [x] `/privacidade` — Política de Privacidade (LGPD)
- [x] `/cookies` — Aviso de Cookies
- [x] Links no rodapé da landing page
- [x] Conteúdo versionado em `docs/legal/*.md` (fonte de verdade) +
      `scripts/gen-legal-content.mjs` (gerador pros `.ts` em `src/content/legal/`)
- [ ] Revisão por advogado antes de publicação formal (placeholder
      `[PREENCHER: endereço completo]` em 2 lugares)