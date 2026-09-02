# 🎓 EternityOS — Guia Didático: RBAC, Multi-Tenancy e Onboarding de Clientes

> **Documento interno** — explica como o sistema funciona por dentro:
> permissões de usuários (RBAC), isolamento entre funerárias (multi-tenancy),
> planos comerciais e o passo a passo para cadastrar um cliente novo.
>
> 📅 Última atualização: Setembro/2026

---

## 📑 Sumário

1. [Preciso de um banco separado por cliente?](#1-preciso-de-um-banco-separado-por-cliente)
2. [RBAC — a engrenagem de permissões](#2-rbac--a-engrenagem-de-permissões)
3. [Planos comerciais — os limites por cliente](#3-planos-comerciais--os-limites-por-cliente)
4. [Onboarding: chegou um cliente novo, e agora?](#4-onboarding-chegou-um-cliente-novo-e-agora)
5. [Resumo visual do fluxo completo](#5-resumo-visual-do-fluxo-completo)
6. [Arquivos do código relacionados](#6-arquivos-do-código-relacionados)

---

## 1️⃣ Preciso de um banco separado por cliente?

**NÃO — e isso é proposital.** O EternityOS usa a arquitetura
**Multi-Tenant com Banco Compartilhado**, o mesmo modelo do Shopify,
Slack e da maioria dos SaaS modernos.

### Como funciona

```
┌─────────────────────────────────────────────────────┐
│              1 BANCO ÚNICO (Supabase)               │
│                                                     │
│  TABELA tenants (as funerárias):                    │
│  ┌──────────────────────┬──────────────────────┐    │
│  │ id: a0000000...0001  │ id: 2340e1fc-ae85... │    │
│  │ Funerária Eternity   │ Funerária São José   │    │
│  └──────────────────────┴──────────────────────┘    │
│                                                     │
│  TABELA holders (os associados):                    │
│  ┌────────────────┬───────────────────────────┐     │
│  │ Carlos Silva   │ tenant_id: a0000000...01  │ ← da funerária 1
│  │ João Souza     │ tenant_id: 2340e1fc...e6  │ ← da funerária 2
│  └────────────────┴───────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Todo registro no sistema tem uma coluna `tenant_id`** — holders,
contracts, vehicles, burials, service_orders, inventory, tudo.
É como se cada funerária tivesse um "apartamento" dentro do mesmo
prédio, com porta trancada.

### As 4 camadas de segurança que impedem mistura

| Camada | Onde atua | O que faz |
|--------|-----------|-----------|
| **1. Middleware `withAuth`** | Toda API | Decodifica o JWT do login e extrai `tenantId` + `role` do usuário. Injeta isso no contexto da requisição |
| **2. Filtro obrigatório** | Toda query | Toda busca/update/delete usa `.eq('tenant_id', auth.tenantId)` — mesmo que alguém tente forjar um ID na URL |
| **3. Superadmin exceção** | `/api/tenants`, `/api/users/roles` | Só o superadmin pode passar `tenant_id` explicitamente (para gerenciar clientes) |
| **4. RLS do Postgres** | Banco (último bastião) | Mesmo que um bug escape do código, as Row Level Security policies do Supabase bloqueiam no nível do banco |

> 💡 **Por que não banco separado?**
> Com 10, 100, 1000 clientes você teria 1000 bancos para migrar,
> fazer backup, atualizar schema e debugar. Com `tenant_id`, roda
> **1 migração** e vale para todos. Isolamento **lógico** com as 4
> camadas acima é mais seguro na prática do que isolamento físico
> mal gerenciado.

---

## 2️⃣ RBAC — a engrenagem de permissões

RBAC = **Role-Based Access Control** (Controle de Acesso por Papel).
No código, vive em `src/config/permissions.ts`.

### Os 6 papéis (hierarquia de cima para baixo)

| Papel | Quem é | O que enxerga |
|-------|--------|---------------|
| 👑 **superadmin** | **Você** (dono do EternityOS) | **TODAS as funerárias.** Cria tenants, muda plano comercial, concede qualquer papel. Nunca pode tomar lockout |
| 🏢 **admin** | Dono da funerária cliente | 100% do **próprio** tenant (financeiro, contratos, usuários, config). NÃO cria tenants, NÃO muda plano, NÃO concede superadmin |
| 📋 **manager** | Gerente operacional | Contratos, óbitos, tanatopraxia, capela, frota, estoque. **Sem** financeiro e sem settings |
| 💰 **financial** | Setor financeiro | Financeiro, contratos, convênios. Não vê plantão/operacional |
| 🎧 **attendant** | Atendimento | Contratos, capela, convalescença, convênios. Sem financeiro |
| 🚐 **driver** | Motorista | Só frota + ver óbitos (leitura) |


### A engrenagem girando na prática

```
1. Motorista faz login
        ↓
2. Supabase Auth valida senha → emite JWT
        ↓
3. Frontend busca user_roles → { role: 'driver', tenant_id: 'a000...' }
        ↓
4. Sidebar chama isTabAllowed('driver', 'financial')
        ↓
5. RESPOSTA: false → o menu "Financeiro" NEM APARECE na tela
        ↓
6. Motorista malicioso abre /api/financial/transactions no Postman
        ↓
7. A API também tem ['superadmin','admin','financial'] no withAuth
        ↓
8. 403 FORBIDDEN ← a UI escondida NÃO é a segurança, a API é
```

> ⚠️ **Princípio mais importante:** a UI esconde, mas a API é quem
> decide. Esconder botão sem travar a API é segurança de papelão —
> o EternityOS trava nos dois lugares.

### Permissões granulares (`ROLE_PERMISSIONS`)

```typescript
driver:    ['canViewBurials', 'canManageFleet'],           // 2 permissões só
attendant: ['canManageContracts', 'canViewBurials',
            'canManageChapel', 'canManageConvalescence',
            'canManageBenefits'],
admin:     [/* TODAS as 12 permissões */],
```

Cada aba do sistema consulta uma permissão:

| Aba do sistema | Permissão exigida |
|----------------|-------------------|
| Painel Executivo | *(manager, financial, admin, superadmin)* |
| Associados & Contratos | `canManageContracts` |
| Financeiro | `canManageFinancial` |
| Plantão / Óbitos | `canViewBurials` |
| Tanatopraxia | `canManageThanato` |
| Salas de Velório | `canManageChapel` |
| Frota | `canManageFleet` |
| Estoque | `canManageInventory` |
| Convalescença | `canManageConvalescence` |
| Convênios | `canManageBenefits` |

> 🛠️ Quer mudar o que um papel faz? Muda **uma linha** no
> `permissions.ts` e reflui no sistema inteiro.

---

## 3️⃣ Planos comerciais — os limites por cliente

### ⚠️ Não confunda os dois tipos de "plano"

| | Plano **ASSOCIATIVO** (tabela `plans`) | Plano **COMERCIAL** (`src/lib/planLimits.ts`) |
|--|----------------------------------------|-----------------------------------------------|
| O que é | "Familiar Ouro", que a funerária **vende pro pai dela** | Essencial/Profissional/Enterprise, que **VOCÊ vende pra funerária** |
| Quem cria | Cada funerária (dentro do tenant) | Só superadmin, no tenant |
| Limita o quê | Preço da mensalidade do associado | Quantos titulares/usuários a funerária pode ter |

### Os 3 planos que você cobra

| Plano | Mensalidade | Titulares | Usuários | Dependentes/titular |
|-------|------------|-----------|----------|---------------------|
| 🥉 **Essencial** | R$ 297/mês | 200 | 1 | 4 |
| 🥈 **Profissional** | R$ 497/mês | 1.000 | 5 | 8 |
| 🥇 **Enterprise** | Sob consulta | ∞ | ∞ | 20 |

**Recursos por plano:**

- **Essencial** — contratos e dependentes, cobrança PIX/boleto, capelas, suporte e-mail
- **Profissional** — tudo do Essencial + frota e motoristas, tanatopraxia, dashboard financeiro, WhatsApp, suporte prioritário
- **Enterprise** — tudo do Profissional + multi-filiais, API personalizada, BI, treinamento, suporte 24/7 com SLA

### O limite é aplicado NA API, não na tela

Quando a funerária Essencial tenta cadastrar o titular 201, o endpoint
`POST /api/holders` chama `checkHolderLimit()` **antes** de inserir:

```json
{
  "error": "Limite de titulares do plano Essencial atingido: 200/200. Faça upgrade para o próximo plano.",
  "code": "PLAN_LIMIT_EXCEEDED",
  "plan": "essencial"
}
```

Status HTTP **402 Payment Required** — semântica perfeita:
o erro em si já vende o upgrade. 😄

---

## 4️⃣ Onboarding: chegou um cliente novo, e agora?

**Cenário:** a *Funerária São José* acabou de fechar contrato com você.

### Passo 1 — Criar o tenant

Painel → **Configurações da Empresa** → Novo Tenant

```
POST /api/tenants
{
  "name": "Funerária São José",
  "cnpj": "12.345.678/0001-90",
  "phone_emergency": "86999990000"
}
```

✅ Resultado: gera o `tenant_id` dela (ex.: `b1111111-2222-3333-4444-555555555555`),
status `active`, plano comercial `essencial` (default).

### Passo 2 — Criar o login do dono dela

Painel → **Usuários & Permissões**

```
POST /api/users/roles
{
  "email": "dono@saojose.com.br",
  "role": "admin",
  "tenant_id": "b1111111-2222-3333-4444-555555555555"
}
```

A API faz 3 coisas automáticas:

1. Cria o usuário no Supabase Auth (com senha temporária)
2. Cria o registro em `user_roles` com `role: 'admin'` + o `tenant_id` que **você** especificou
3. Valida o limite de usuários do plano (Essencial = 1 usuário)

> 🔑 **Detalhe de segurança:** só **superadmin** pode informar
> `tenant_id` de outro. Se um admin tentar, a API **ignora** o
> `tenant_id` enviado e usa o próprio — impossível criar conta
> "espiã" em tenant alheio.

### Passo 3 — O cliente loga

Herda automaticamente:

- Vê **somente** os dados do tenant dele (zero da sua funerária, zero de outros clientes)
- Tem as 12 permissões de admin **dentro da casa dele**
- Não vê o painel de gestão de tenants (exclusivo do superadmin)

### Passo 4 — Upsell de plano

Quando bater 200 titulares, o 402 aparece na tela dele. Para fazer upgrade:

```
PATCH /api/tenants
{
  "tenant_id": "b1111111-2222-3333-4444-555555555555",
  "commercial_plan": "profissional"
}
```

Rejeitado com 403 se tentar vindo de um `admin` — só superadmin
muda plano, porque **impacta cobrança**.

### 🪦 E quando um familiar de um associado morre?

Já está integrado! A **Ordem de Serviço** (Plantão → "+ Registrar Chamado")
tem o seletor **Titular / Dependente / Público Geral**:

- Escolhendo **"Dependente"**, vincula ao contrato do titular
- O sistema sabe **quem paga** (contrato), **qual veículo vai** (frota → "Em Missão") e **qual urna baixa** (estoque)
- Tudo dentro do tenant correto — **nunca vaza pra outra funerária**

Fluxo completo da integração:

```
Óbito registrado
   ├── 1. service_order criada (quem faleceu + contrato)
   ├── 2. chapel_burial criado (registro do sepultamento)
   ├── 3. veículo designado → status "Em Missão"
   ├── 4. itens do estoque vinculados → estoque baixa (decrement_stock)
   └── 5. ao concluir → veículo volta pra "Disponível"
```

---

## 5️⃣ Resumo visual do fluxo completo

```
   VOCÊ (superadmin)
        │
        ├── cria tenant ──────→ 🏢 Funerária São José
        ├── define plano ─────→ Essencial R$297 (limites ativos)
        ├── cria admin ───────→ 👤 dono@saojose.com.br
        │                          │
        │                          └── cria seus funcionários:
        │                              📋 manager
        │                              💰 financial
        │                              🎧 attendant
        │                              🚐 driver
        │
        └── monitora uso ─────→ GET /api/tenants
                                { usage: { holders: 87, users: 3 } }
```

---

## 6️⃣ Arquivos do código relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/config/permissions.ts` | Papéis, permissões e acesso às abas (`isTabAllowed`, `hasPermission`) |
| `src/lib/api-handler.ts` | Middleware `withAuth` — extrai role/tenant do JWT e valida roles permitidas |
| `src/lib/planLimits.ts` | Planos comerciais e limites (`checkHolderLimit`, `checkUserLimit`) |
| `src/app/api/tenants/route.ts` | CRUD de funerárias + mudança de plano (só superadmin) |
| `src/app/api/users/roles/route.ts` | Concessão/revogação de papéis + onboarding de usuários |
| `src/app/api/service-orders/route.ts` | Ordem de Serviço integrada (óbito + contrato + frota + estoque) |

---

*EternityOS — Sistema de Gestão Funerária Multi-Tenant*

