# ETERNITYOS - ROADMAP E PENDENCIAS (memoria de sessao)

> **REGRA PERMANENTE (ordem do usuário):** TODA comunicação, código, comentários,
> UI, commit messages e documentação devem estar em **PORTUGUÊS DO BRASIL**.
> Nunca responder nem escrever código em espanhol ou outro idioma.
> Esta regra vale para todas as sessões futuras.

> Manutenção: atualizar sempre que concluir um item.

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
- [x] `tailwind.config.js` â†’ `darkMode: 'class'`
- [x] `src/components/ThemeToggle.tsx` â€” alternador com persistÃªncia no localStorage
- [x] `src/app/layout.tsx` â€” script anti-flash (CSP-safe) + classe `dark` via `<script>` inline (default dark para nao mudar a experiencia atual) + Toaster `theme="system"`
- [x] `src/app/globals.css` â€” variÃ¡veis CSS `--background/--foreground` para claro/escuro + scrollbar adaptativa + transicao 0.2s
- [x] `scripts/convert-theme.js` â€” script idempotente (lookbehind `(?<![\w:])`) que converte classes dark-only (bg-zinc-950 â†’ bg-slate-50 dark:bg-zinc-950, text-white â†’ text-slate-900 dark:text-white) preservando cor de botoes coloridos
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
- [x] Integração no menu lateral e header do `page.tsx`

### FASE 3 - Aguardando habilitação externa ⏳
- [ ] **FocusNFe precisa habilitar o CNPJ da funerária** (email já foi enviado pedindo)
- [ ] Sandbox não disponível para Teresina (PI) — limitação da prefeitura (provedor Dsf)
- [ ] Teste em produção com valor baixo + cancelamento (recomendação da FocusNFe)
- [ ] Token de produção: `7TaSTZhSJ9A2opektRmqDwSKCiFHeNZs` (aguardando habilitação)

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
      Tabla `lead_notes` (migration `scripts/crm_lead_notes.sql` — RODAR no
      Supabase) + API GET/POST/DELETE `/api/lead-notes` (superadmin) + botón
      "📋 Hist." em cada card com modal de historial (listar + añadir + eliminar
      con confirmación).

## 6. BUSCA + CADASTRO DE TITULARES (Novo) - CONCLUIDO

### Busca de Associados (Demanda do usuario)
- [x] Problema: a busca no `/holders` sÃ³ bateia CPF formatado e `phone` sem
      normalizacao, entao nome/WhatsApp sem formataÃ§Ã£o nao encontravam.
- [x] Corrigido em `src/app/page.tsx` (filteredHolders): normaliza acentos (NFD),
      remove nÃ£o-numericos do phone (como faz no CPF) e expande para Cidade/UF.
      Agora busca por **nome (com/sem acento), CPF, WhatsApp, Cidade, UF**.
- [x] `next build` OK.

### Formulario "Novo Titular" + API
- [x] Formulario enriquecido (`page.tsx`, `holderForm` + JSX): campos
      **Cidade, UF, Data Nascimento, GÃªnero (select), ObservaÃ§Ãµes** â€” todos
      com direcionamento preciso via API (`POST/PATCH /api/holders`).
- [x] `src/app/api/holders/route.ts`: parse + insert dos novos campos com
      **retry defensivo** (se a coluna nao existir no DB, refaz insert sem
      extras) -> cadastro de titular nunca quebra.
- [x] Migration `scripts/holders-enrich-columns.sql` (ADD COLUMN IF NOT EXISTS,
      idempotent) para rodar no Supabase SQL Editor.
- [x] Interface `Holder` tipada com os novos campos.

## 5. TRANSMISSAO AO VIVO - ADIADO (decisao de roadmap)

- [ ] Cortado do roadmap atual. Exige infra de streaming (custo).

## 7. PENDÃŠNCIAS TÃ‰CNICAS / FOLLOW-UP (memoria de sessao)

### A. Dependentes via API server (hardening)
- [ ] Criar `src/app/api/dependent/route.ts` (POST/PATCH/DELETE) usando `supabaseAdmin`
      (hoje `handleAddDep` no page.tsx salva via cliente browser, dependento de RLS).
- [ ] Migrar page.tsx `handleAddDep` â†’ `authFetch("/api/dependent")`.
- [ ] Rodar `scripts/holders-enrich-columns.sql` no Supabase para ativar
      cidade/uf/birth_date/gender/observations no DB.

### B. RevisÃ£o visual do theme claro no monÃ³lito page.tsx
- [ ] O `scripts/convert-theme.js` converteu as classes principais; validar
      estilos de `select`, `input[type=date]`, e botÃµes coloridos (text-white
      preservado) em modo claro â€” ajustes manuais se houver contraste baixo.
- [ ] Garantir que o ThemeToggle apareÃ§a em mobile (header collapsado).

### C. Agente WhatsApp (continua em andamento)
- [ ] Painel PlantÃ£o 24h: listar chamados (GET /api/emergency-dispatches) + PATCH status.
- [ ] FormulÃ¡rio "Conectar WhatsApp" nas ConfiguraÃ§Ãµes (gravar `tenant_whatsapp_numbers`).
- [ ] Infra do cliente: instalar Evolution API (Docker/VPS) + webhook Vercel env vars.

### D. NFS-e
- [ ] AGUARDA decisÃ£o do gateway (Focus NFe / FastNFe / Nota Carioca API / outro).
- [ ] Criar tabela `nfse_invoices` + rotas GET/POST /api/nfse quando gateway definido.
- [ ] Prazo: IBS/CBS obrigatÃ³rio a partir de out/2026.

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
- [x] AUDITORIA: `webhook_events` (migration `scripts/webhook_events_migration.sql`)
      registra TODO evento do Asaas com payload + processed/skipped_reason.
      Código com degradação graciosa (webhook funciona mesmo sem a tabela).
- [x] TESTES: `tests/lib/eligibility.test.ts` + `tests/lib/financial.test.ts`
      — 5 suites / 100 testes verdes (`npx jest`).

### AÇÃO MANUAL: rodar `scripts/webhook_events_migration.sql` no Supabase
- [ ] Sem a tabela, a auditoria fica desligada (o webhook NÃO quebra, só não audita).

### Pendente (próximas sessões, nesta ordem)
- [ ] **useBilling — DECISÃO DO USUÁRIO (anotado, não urgente)**: extrair handlers
      de cobrança do monólito `page.tsx` (~4.500 linhas) para hooks. Executar
      INCREMENTALMENTE, um handler por vez (mover → testes → build → deploy →
      validar), nunca big-bang. **Piloto sugerido: cobrança avulsa** (mais nova
      e isolada). Momento ideal: antes da próxima feature grande de cobrança.
- [ ] **Dependentes via API server** (pendência antiga, seção 7A — CONFIRMADO
      pendente em 2026-09): `/api/dependent` não existe; `handleAddDep`
      (page.tsx ~linha 1361) salva pelo client browser (`supabase.from("dependents")`).
      Criar rota com `supabaseAdmin` + migrar para `authFetch` — é o último
      fluxo de escrita fora do padrão server-side do sistema.
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
