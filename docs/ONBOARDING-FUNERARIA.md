# Onboarding de Funerária — Checklist operacional

> Passo a passo do que fazer quando um cliente novo fecha.
> Atualizado em 2026-09-23.

## Visão geral

Toda funerária nova precisa de 2 coisas **antes de operar**:
1. Tenant criado no sistema (você faz)
2. Conta Asaas própria configurada (ela faz, ou você faz por ela)

Enquanto a conta Asaas não está configurada, **as cobranças dos
associados caem na conta da PRIMEX** — não é o ideal. Configura
sempre antes da primeira cobrança real.

---

## ETAPA 1 — Pré-contrato (você)

- [ ] Cliente assinou contrato (Termos de Uso + DPA + proposta)?
- [ ] CNPJ do cliente está ativo e regular na Receita?
- [ ] Dono/admin do cliente tem e-mail que ele acessa (vai virar login)?
- [ ] Definir plano: Essencial (R$ 397) ou Profissional (R$ 597)?
- [ ] Definir dia de vencimento (padrão: dia 10)?

## ETAPA 2 — Criar o tenant (você)

- [ ] Rodar `node scripts/onboard_cliente.mjs "Nome Empresa" "CNPJ" "email@dono.com"`
- [ ] Confirmar que o tenant foi criado (mensagem `[TENANT] criado: ...`)
- [ ] Confirmar que o dono foi vinculado como ADMIN

**O que o script faz:**
- Cria tenant `status=active`, `commercial_plan=essencial`
- Cria plano associativo padrão "Familiar" (R$ 69,90/mês)
- Vincula o e-mail informado como ADMIN do tenant

## ETAPA 3 — Configurar SaaS billing (você)

- [ ] Abrir `/admin/saas` no sistema
- [ ] Clicar em **"+ Nova assinatura"**
- [ ] Selecionar o tenant novo
- [ ] Escolher plano (Essencial ou Profissional)
- [ ] Definir data de vencimento (dia 10 do próximo mês)
- [ ] Confirmar → cobrança é criada no Asaas (conta PRIMEX)

**O que acontece:**
- Cliente Asaas criado com nome `SAAS::NomeFuneraria`
- Assinatura mensal recorrente agendada
- Cliente recebe e-mail do Asaas com link de pagamento (PIX/boleto)

## ETAPA 4 — Configurar Asaas da funerária (cliente)

⚠️ **CRÍTICO — sem isso, cobranças de associados caem na PRIMEX.**

- [ ] Orientar o cliente a abrir conta em `https://www.asaas.com`
  - CNPJ da funerária (não CPF do dono)
  - Documentos: contrato social + CNPJ + comprovante de endereço
  - Tempo: 1-3 dias úteis para aprovação
- [ ] Quando a conta estiver ativa, pegar a **API Key de produção**
  - Painel Asaas → **Integrações** → **API** → copiar chave
- [ ] Cadastrar no sistema:
  - Login do dono → `/configuracoes` → aba **Empresa** → **Asaas**
  - Colar a API Key no campo
  - Preencher: Wallet ID (Asaas → Integrações → Wallet ID)
  - Ambiente: **Produção** (não Sandbox)
  - Salvar
- [ ] Confirmar que a flag `has_asaas_api_key` está verde

**O que muda:** a partir daqui, todas as cobranças de associado caem na conta da **funerária**, não da PRIMEX.

## ETAPA 5 — Configurar webhook Asaas da funerária (cliente + você)

- [ ] No painel Asaas da funerária: **Integrações → Webhooks**
- [ ] URL: `https://eternitysos.vercel.app/api/webhooks/asaas`
- [ ] Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`
- [ ] Token: gerar um forte (`SAAS...` ou similar, mínimo 32 chars) e copiar
- [ ] Cadastrar o token no sistema:
  - `/configuracoes` → Asaas → **Webhook Token** → colar
  - Salvar
- [ ] Testar: painel Asaas → "Enviar evento de teste" → conferir se retorna 200

## ETAPA 6 — Treinamento (você + cliente)

- [ ] Vídeo chamada de 1h com o dono + operadores
- [ ] Mostrar:
  - Cadastro de titular + dependente
  - Criação de contrato + associado
  - Cobrança PIX/boleto (individual e lote)
  - Emissão de NFS-e (se tiver FocusNFe ativa)
  - Rastreio de OS via QR
- [ ] Entregar link do `/crm` do suporte
- [ ] Adicionar o cliente no grupo de WhatsApp de suporte

## ETAPA 7 — Go-live

- [ ] Cliente cadastrou pelo menos 5 titulares de teste
- [ ] Cliente gerou uma cobrança PIX de teste (R$ 0,01)
- [ ] Cliente recebeu o PIX (confirmar que cai na conta dele, não na PRIMEX)
- [ ] Cliente emite NFS-e de teste (se aplicável)
- [ ] Cliente aprova go-live

---

## Checklist resumido (ordem do dia)

| # | O quê | Quem | Tempo |
|---|-------|------|-------|
| 1 | Contrato assinado | Você | prévio |
| 2 | Criar tenant | Você | 2 min |
| 3 | Assinatura SaaS | Você | 3 min |
| 4 | Conta Asaas da funerária | Cliente | 1-3 dias |
| 5 | API Key no sistema | Cliente | 5 min |
| 6 | Webhook Asaas | Cliente | 5 min |
| 7 | Treinamento | Ambos | 1h |
| 8 | Go-live | Ambos | 30 min |

**Total (após conta Asaas aprovada):** ~2 horas.

---

## Sinais de alerta

- 🚨 Cliente usando o sistema **sem** configurar Asaas dele → cobranças caem na PRIMEX → **avisar em 48h**
- 🚨 Webhook não configurado → pagamento chega mas sistema não marca `paid` → conciliação manual
- 🚨 Cliente não paga a assinatura SaaS → grace period 7 dias → banner vermelho → bloqueio após 15
- 🚨 `has_asaas_api_key` fica vermelho depois de verde → chave revogada no Asaas → cliente precisa gerar nova

---

## Quando o cliente já tem conta Asaas

Se a funerária já usa Asaas pra outras coisas, pular direto pra:
- ETAPA 4 (pegar a API Key existente)
- ETAPA 5 (configurar webhook)
- ETAPA 6 (treinamento)

Sem precisar criar conta nova.

---

## Contatos úteis

- **Asaas suporte:** `https://www.asaas.com/help`
- **Sistema:** `https://eternitysos.vercel.app`
- **Suporte PRIMEX:** WhatsApp (86) 98811-7925
- **E-mail:** pedrofsneto33@gmail.com