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
- [x] `tailwind.config.js` → `darkMode: 'class'`
- [x] `src/components/ThemeToggle.tsx` — alternador com persistência no localStorage
- [x] `src/app/layout.tsx` — script anti-flash (CSP-safe) + classe `dark` via `<script>` inline (default dark para nao mudar a experiencia atual) + Toaster `theme="system"`
- [x] `src/app/globals.css` — variáveis CSS `--background/--foreground` para claro/escuro + scrollbar adaptativa + transicao 0.2s
- [x] `scripts/convert-theme.js` — script idempotente (lookbehind `(?<![\w:])`) que converte classes dark-only (bg-zinc-950 → bg-slate-50 dark:bg-zinc-950, text-white → text-slate-900 dark:text-white) preservando cor de botoes coloridos
- [x] `tsc --noEmit` OK; `next build` compilou OK (3.3s)
- [x] Default: escuro (nao altera UX atual); usuarios escolhem claro via toggle

## 3. NFS-e (Nota Fiscal de Servico) - AGUARDANDO DECISAO DE NEGOCIO

### Pendente
- [ ] AGUARDANDO o usuario escolher o GATEWAY (recomendado: Focus NFe / FastNFe / Nota Carioca API etc.)
- [ ] Nao e implementavel enquanto nao houver a escolha (cada gateway tem SDK/API propria
      e catalogo de prefeituras)
- [ ] Prazo legal: campos IBS/CBS obrigatorios na NFS-e a partir de out/2026
      (Ato Conjunto RFB/CGIBS nº 04/2026).

### Proposta de arquitetura (validar ao escolher o gateway)
- [ ] Tabela `nfse_invoices` (id, tenant_id, contract_id, service_description,
      service_value, city_code, status [pending|issued|canceled|error],
      nfse_number, verification_code, xml_url, pdf_url, provider_invoice_id, errors, created_at/updated_at) — **independente do gateway**, pode ser criada agora.
- [ ] Rotas: GET /api/nfse (listar), POST /api/nfse (emitir), GET /api/nfse/:id (pdf/xml) — **adaptar contrato ao provedor escolhido**.
- [ ] Webhook opcional de retorno de autorizacao/lote.

## 4. CRM DE LEADS / PIPELINE - NAO INICIADO (so codigo)

- [ ] Tabela `leads` + kanban simples + WhatsApp pra follow-up automatico
- [ ] Sem passo manual

## 5. TRANSMISSAO AO VIVO - ADIADO (decisao de roadmap)

- [ ] Cortado do roadmap atual. Exige infra de streaming (custo).