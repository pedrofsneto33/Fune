# ETERNITYOS - ROADMAP E PENDENCIAS (memoria de sessao)

> Mantido para nao perder nada entre sessoes. Atualizar sempre que concluir um item.

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