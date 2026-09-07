# ETERNITYOS - ROADMAP E PENDENCIAS (memoria de sessao)

> Mantido para nao perder nada entre sessoes. Atualizar sempre que concluir um item.

## 1. AGENTE DE TRIAGEM WHATSAPP (Evolution API) - EM ANDAMENTO

### Ja feito (commit `ed3b35b`, no GitHub)
- [x] Backend completo: `src/lib/whatsappAgent.ts` (maquina de estado), webhook
      `src/app/api/webhooks/whatsapp/route.ts`, API `src/app/api/emergency-dispatches/route.ts`,
      migracao `scripts/agente-whatsapp.sql`
- [x] .env.example atualizado com EVOLUTION_API_URL / EVOLUTION_API_KEY / WHATSAPP_WEBHOOK_TOKEN
- [x] SQL ja rodado pelo usuario no Supabase SQL Editor
- [x] tsc/build passando

### Falta (passo a passo, proximas sessoes)
- [ ] Painel no frontend: aba Plantao 24h deve listar os chamados do bot
      (fetch GET /api/emergency-dispatches) com status e acoes (PATCH status)
- [ ] Formulario "Conectar numero WhatsApp" nas Configuracoes da Empresa
      (grava tenant_whatsapp_numbers: numero + evolution_instance + active)
- [ ] Infra do cliente (manual): instalar Evolution API (Docker/VPS),
      criar instancia, conectar numero, configurar webhook para
      https://eternityos.vercel.app/api/webhooks/whatsapp, setar variaveis
      na Vercel: EVOLUTION_API_URL, EVOLUTION_API_KEY, WHATSAPP_WEBHOOK_TOKEN

## 2. TEMA CLARO (dark/light) - CONCLUIDO

### Feito (commit `04a1727`, no GitHub)
- [x] `tailwind.config.js` â†’ `darkMode: 'class'`
- [x] `src/components/ThemeToggle.tsx` â€” alternador com persistÃªncia no localStorage
- [x] `src/app/layout.tsx` â€” script anti-flash (CSP-safe) + classe `dark` via `<script>` inline (default dark para nao mudar a experiencia atual) + Toaster `theme="system"`
- [x] `src/app/globals.css` â€” variÃ¡veis CSS `--background/--foreground` para claro/escuro + scrollbar adaptativa + transicao 0.2s
- [x] `scripts/convert-theme.js` â€” script idempotente (lookbehind `(?<![\w:])`) que converte classes dark-only (bg-zinc-950 â†’ bg-slate-50 dark:bg-zinc-950, text-white â†’ text-slate-900 dark:text-white) preservando cor de botoes coloridos
- [x] `tsc --noEmit` OK; `next build` compilou OK (3.3s)
- [x] Default: escuro (nao altera UX atual); usuarios escolhem claro via toggle


## 3. NFS-e (Nota Fiscal de Servico) - FASE 1 FEITA (commit `bb2e2a0`)

### FASE 1 - Estrutura preparada OK
- [x] Tabela `public.fiscal_invoices` - historico completo de tentativas, com isolamento por tenant
- [x] Colunas Reforma Tributaria (IBS/CBS) ja criadas (cst, c_class_trib, ind_natureza_op, v_bc_ibs_cbs, p_ibs_cbs, v_ibs, v_cbs)
- [x] RLS com isolamento por tenant
- [x] Indices para performance (tenant, status, data, numero, service_order)
- [x] Colunas em `service_orders`: `nfse_id`, `nfse_status`, `nfse_required`
- [x] Colunas de config em `tenants`: provedor, env, api_key, CNPJ, endereco, IBGE, CNAE, regime, codigo servico, aliquota ISS, auto_emit
- [x] View `public.v_service_orders_without_nfse` (OS concluidas sem NFS-e)
- [x] Stub em `src/lib/fiscal/index.ts` - funcoes `getFiscalConfig`, `emitNfse`, `cancelNfse`, `testFiscalConnection` (lancam erro amigavel ate provedor ser escolhido)
- [x] Migration `scripts/nfse_migration.sql` (idempotente) - ainda nao rodada no Supabase

### FASE 2 - Escolha do provedor (PROXIMO PASSO quando decidir)
- NFE.io (recomendado: REST moderna, ~R$ 0,30/NFS-e)
- eNotas (~R$ 0,15, UI propria)
- FocusNFe (barato, 100+ prefeituras)
- Tecnospeed (padrao de mercado, 60% share)

### FASE 3 - Implementacao do provedor (depois da FASE 2)
- [ ] Criar `src/lib/fiscal/<provider>.ts` com a chamada HTTP real
- [ ] Criar rotas `src/app/api/fiscal/emit`, `cancel`, `[id]`, `webhooks/fiscal`
- [ ] Adicionar bloco "Configuracao Fiscal" no `TenantSettingsTab`
- [ ] Criar aba "Fiscal" no menu lateral
- [ ] Testes em sandbox do provedor
- [ ] Homologacao com contador

## 4. CRM DE LEADS / PIPELINE - NAO INICIADO (so codigo)

- [ ] Tabela `leads` + kanban simples + WhatsApp pra follow-up automatico
- [ ] Sem passo manual

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