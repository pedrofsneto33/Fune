# AUDITORIA ETERNITYOS — Relatório Completo

**Projeto:** EternityOS (ERP funerário multi-tenant, B2B por assinatura)
**Stack:** Next.js 16 (App Router) + React 19 + Supabase (Auth/PostgREST/RLS) + Asaas (pagamentos) + FocusNFe (NFS-e) + Evolution API (WhatsApp)
**Data:** 2026-09-12
**Escopo:** 7 camadas (Funcional, Lógica de Negócio, APIs/Integrações, Segurança, Dados, UI/UX, Produção)

---

## A. Sumário Executivo

**Veredito anterior: ❌ NÃO LANÇAR → agora ⚠️ PRONTO COM RESSALVAS**

Após correções, o core financeiro-crítico está sanado. O que ainda depende de ação operacional sua está listado na seção **Pendente (sua ação)**.

**5 achados mais críticos (TODOS CORRIGIDOS):**
1. PIX gravava em colunas inexistentes → cobrança órfã no sistema (nunca conciliava)
2. Webhook Asaas fail-open (HMAC morto) → token como única barreira
3. Dados fictícios (estoque/convalescência) apresentados como operação real
4. "Gerar Boleto" não emitia boleto (só insert local pendente)
5. 442 linhas de mojibake em textos visíveis ao usuário

**Notas por camada:**

| # | Camada | Nota |
|---|--------|------|
| 1 | Funcional | 7/10 |
| 2 | Lógica de negócio | 7/10 |
| 3 | APIs e integrações | 7/10 |
| 4 | Segurança | 7/10 |
| 5 | Dados | 6/10 |
| 6 | UI/UX | 5/10 |
| 7 | Produção/Operação | 4/10 |
| | **Geral** | **~6/10** |

---

## B. Pendente — SUA AÇÃO (não faço via chat)

### 1. Rodar migration (DDL — exige Supabase SQL Editor)
```sql
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS last_retried_at TIMESTAMPTZ;
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS retry_error TEXT;
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed
  ON public.webhook_events(received_at DESC) WHERE processed = FALSE;
```
> ✅ **FEITO (você)** — colunas confirmadas no banco: `retry_count` (integer, default 0), `last_retried_at` (timestamptz), `retry_error` (text).

### 2. Rotacionar segredos
- **`SUPABASE_SERVICE_ROLE_KEY`** — transitou em texto plano nesta sessão. Considere comprometida. Rode em Supabase Dashboard > Settings > API.
- **`asaas_webhook_token`** de cada tenant — estão em texto plano no banco.

### 3. Variáveis de ambiente na Vercel
- **`ASAAS_ALLOWED_IPS`** (CSV com IPs oficiais do Asaas — docs.asaas.com > Segurança > Whitelist de IPs)
- Opcional: `ASAAS_WEBHOOK_SECRET`
> ✅ **PARCIAL (você)** — token do webhook Asaas configurado no banco (4 tenants) e validado com POST real: **HTTP 200**. Falta só `ASAAS_ALLOWED_IPS` (recomendado).

---

## C. Correções Aplicadas (P0/P1) — diff aplicados e validados

### F-02 — Webhook Asaas fail-open
**Arquivo:** `src/app/api/webhooks/asaas/route.ts:1-110`
**Descoberta validada na doc oficial:** o Asaas NÃO assina o corpo do webhook — a validação de origem É o token no header `asaas-access-token` (que o código já usava). O bloco HMAC/`ASAAS_WEBHOOK_SECRET` era código morto (falsa sensação de segurança).
**Depois:** removido o HMAC; adicionada deduplicação por evento (at-least-once — doc oficial); whitelist opcional de IPs via `ASAAS_ALLOWED_IPS`; documentação no `.env.example`.
**Teste:** `tests/routes/webhook-auth.test.ts`

### F-04 — Boleto não era emitido
**Arquivo:** `src/app/api/billing/boleto/route.ts` (reescrito)
**Antes:** só inseria `payments` pendente local.
**Depois:** integração real com Asaas — busca/cria cliente por CPF, cria cobrança BOLETO com `externalReference=contractId`, persiste via `upsert onConflict='asaas_payment_id'`, retorna `bankSlipUrl`. Timeout 15s/chamada.
**Teste:** `tests/routes/money-columns.test.ts`

### F-06 — Carnê perdia centavos
**Arquivo:** `src/app/api/payment-carnets/route.ts:36-37`
**Antes:** R$100÷3 = 33,33×3 = 99,99.
**Depois:** aritmética em centavos, resto distribuído nas primeiras parcelas (33,34+33,33+33,33=100,00).

### F-03 — Mocks hardcoded
**Arquivo:** `src/app/page.tsx:~196-248`
**Antes:** 4 itens de estoque e 3 empréstimos inventados, renderizados como reais.
**Depois:** estado vazio + empty state. Fetch de inventário agora sobrescreve inclusive com array vazio.
**Teste:** `tests/ui-auth-gate.test.ts`

### F-08/F-09 — Fail-open no role + auto-cadastro
**Arquivo:** `src/app/page.tsx`
**Depois:** default `null` + tela de pendência; signup removido (onboarding B2B = convite via RBAC).
**Teste:** `tests/ui-auth-gate.test.ts`

### F-12 — Validação de veículo engolida
**Arquivo:** `src/app/api/service-orders/route.ts`
**Antes:** checagem "Em Missão" dentro de `if (!ownedContract)` → 2 OS no mesmo veículo.
**Depois:** movida ao bloco `if (vehicle_id)` correto.
**Teste:** `tests/routes/agent-steps.test.ts`

### F-13 — WhatsApp com passos trocados
**Arquivo:** `src/lib/whatsappAgent.ts:104-114`
**Depois:** `init→deceasedName`, `location→location`, `family→familyContact`.
**Teste:** `tests/routes/agent-steps.test.ts`

### F-14 — Mojibake (442→~22 linhas; 22 restantes são palavras legítimas: NÃO/AÇÃO/COMISSÃO)
**Arquivos:** sweep em `src/` via `fix-mojibake.py` (tabela ÃX→acento + colapso de duplicatas).
**Teste:** `tests/routes/encoding-csp.test.ts`

### F-15 — N+1 no GET de titulares
**Arquivo:** `src/app/api/holders/route.ts`
**Antes:** 2 queries/titular (até 2001). **Depois:** 2 queries em lote (`.in`) + Map.
**Teste:** `tests/routes/holders.test.ts`

### F-11 — DELETE destrutivo
**Arquivo:** `src/app/api/holders/route.ts`
**Antes:** CASCADE destruía pagamentos. **Depois:** soft delete (`status='inativo'`).

### F-17 — CSP / F-18 — Cor do botão
**Arquivo:** `src/middleware.ts:15` (`style-src` + `unsafe-inline`); `src/app/page.tsx` (slate).

### F-19 — CPF sem dígito
**Arquivo:** `src/lib/validation.ts` (validação completa dos 2 dígitos).
**Teste:** `tests/routes/holders.test.ts`

---

## D. Backlog P2 (não bloqueiam o core)

| ID | Descrição | Onde | Status |
|---|---|---|---|
| F-20 | Código morto: `useAuth`, `handler.ts` da carteirinha | `src/hooks/useAuth.ts`, `src/app/api/carteirinha/handler.ts` | ✅ **CORRIGIDO** (removidos + stubs fiscais removidos) |
| F-21 | KPI "inadimplência" mede contratos inativos | `src/app/api/dashboard/kpis/route.ts` | ✅ CORRIGIDO (vencidos/vencíveis) |
| F-22 | Segredos em texto plano no banco; rate-limiter em memória | `tenants`, `src/lib/rate-limiter.ts` | 🟡 PARCIAL (KV + healthz feitos; criptografia de segredos no banco segue para backlog) |
| F-23 | `asaas-batch` sem timeout nas chamadas fetch | `src/app/api/billing/asaas-batch/route.ts` | ✅ CORRIGIDO |
| F-24 | A11y: labels sem `htmlFor`; botões sem loading; `console.log` no modal | login, modais | 🟡 PARCIAL (modal + login padronizados; demais botões → backlog) |
| F-25 | Rota `/api/convalescence` nunca chamada pela UI | `src/app/page.tsx` | ⏳ PENDENTE (aba usa estado local; dados somem ao recarregar) |
| F-26 | `img-src` permite qualquer host https | `src/middleware.ts` | ⏳ PENDENTE |
| F-27 | Cache rule `/static/` não casa com `/_next/static/` | `src/next.config.ts:50-59` | ⏳ PENDENTE |
| F-28 | GET holders sem LIMIT (enterprise=ilimitado) | `src/app/api/holders/route.ts` | ⏳ PENDENTE |

---

## E. Testes de regressão (139 total, tsc limpo)

| Arquivo | Cobre |
|---|---|
| `tests/routes/money-columns.test.ts` | F-01, F-04, F-06 |
| `tests/routes/webhook-auth.test.ts` | F-02 |
| `tests/routes/holders.test.ts` | F-11, F-15, F-19 |
| `tests/routes/agent-steps.test.ts` | F-12, F-13 |
| `tests/routes/encoding-csp.test.ts` | F-14, F-17 |
| `tests/ui-auth-gate.test.ts` | F-03, F-08, F-09 |

---

## F. Comandos para validar

```bash
npx tsc --noEmit        # deve sair limpo
npm test                 # 139/139 passam
# Smoke ao vivo (produção) já validado:
curl -X POST https://eternitysos.vercel.app/api/webhooks/asaas -H "asaas-access-token: SEU_TOKEN" -d '{}'   # 200/401 conforme token
```

---

## G. Veredito

**Antes:** não estava lançável (PIX não conciliava, boleto não emitia, webhook aberto, estoque inventado).
**Agora:** fluxo de dinheiro ponta-a-ponta funcional e testado (webhook Asaas validado em produção com **HTTP 200**); painel sem dados fictícios; auth fail-closed; migration de auditoria aplicada; código morto removido. Faltam apenas: rotacionar `SUPABASE_SERVICE_ROLE_KEY` (segredo exposto na sessão), `ASAAS_ALLOWED_IPS`, e os refinamentos P2 do backlog (tabela D).

**Recomendação:** atacar primeiro os P2 listados como ⏳ PENDENTE na tabela D — na ordem F-25 (convalescença sem persistência), F-26/F-27 (hardening de rede), F-28 (paginação).
