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

## 2. TEMA CLARO (dark/light) - NAO INICIADO (nao exige passo manual)

- [ ] Não precisa de acao manual do usuario. So codigo.
- [ ] Implementacao: toggle + classe `dark` no <html> + Tailwind darkMode:'class'
- [ ] Tag de cima: "quick win" de 2-3h

## 3. NFS-e (Nota Fiscal de Servico) - AGUARDANDO DECISAO DE NEGOCIO

- [ ] AGUARDANDO o usuario escolher o GATEWAY (recomendado: Focus NFe / FastNFe / Nota Carioca API etc.)
- [ ] Nao e implementavel enquanto nao houver a escolha (cada gateway tem SDK/API propria
      e catalogo de prefeituras)
- [ ] Prazo legal: campos IBS/CBS obrigatorios na NFS-e a partir de out/2026
      (Ato Conjunto RFB/CGIBS nº 04/2026)

## 4. CRM DE LEADS / PIPELINE - NAO INICIADO (so codigo)

- [ ] Tabela `leads` + kanban simples + WhatsApp pra follow-up automatico
- [ ] Sem passo manual

## 5. TRANSMISSAO AO VIVO - ADIADO (decisao de roadmap)

- [ ] Cortado do roadmap atual. Exige infra de streaming (custo).