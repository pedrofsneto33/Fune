# 📊 EternitySOS — Graphify (mapa visual del proyecto)

> Generado con `graphify` sobre el repo `C:\Users\User\eternitysos`.
> Estado del código: commit `49f53a5` (2026-09-13). Next.js 16 · React 19 · Supabase · Asaas.
>
> 🎨 Para ver los diagramas: abre este archivo con la extensión
> **"Markdown Preview Mermaid"** de VS Code, o pega cada bloque en
> [mermaid.live](https://mermaid.live). En GitHub/Markdown que soporte
> Mermaid también renderizan.
>
> Complemento didáctico: [`ARQUITETURA-RBAC-MULTITENANT.md`](./ARQUITETURA-RBAC-MULTITENANT.md).

## 📑 Índice

1. [Vista general de arquitectura](#1-vista-general-de-arquitectura)
2. [Cadena de autenticación y las 4 capas de aislamiento](#2-cadena-de-autenticación-y-las-4-capas-de-aislamiento)
3. [Mapa de dominios → rutas API](#3-mapa-de-dominios--rutas-api)
4. [Capas de librerías (src/lib) y servicios](#4-capas-de-librerías-srclib-y-servicios)
5. [Frontend — páginas, componentes y contexto](#5-frontend--páginas-componentes-y-contexto)
6. [Modelo de datos (ERD)](#6-modelo-de-datos-erd)
7. [Flujo: atención de un óbito (plantão 24 h)](#7-flujo-atención-de-un-óbito-plantão-24-h)
8. [Flujo: cobranza y conciliación Asaas](#8-flujo-cobranza-y-conciliación-asaas)
9. [Anexo: mapa completo de rutas y cómo regenerar](#9-anexo-mapa-completo-de-rutas-y-cómo-regenerar)

---

## 1. Vista general de arquitectura

```mermaid
flowchart TB
  subgraph cli["🌐 Navegador"]
    pub["Páginas públicas<br/>/landing · /login · /carteirinha/[cpf]"]
    dash["App principal — dashboard<br/>src/app/page.tsx (monolito ~5.1k líneas)<br/>tabs habilitadas por rol (isTabAllowed)"]
  end

  subgraph nx["⚡ Next.js 16 (App Router)"]
    mw["Middleware de seguridad<br/>CSP con nonce · headers HTTP duros<br/>matcher excluye /api · _next · favicon"]
    api["API routes<br/>src/app/api/**/route.ts · ~55 endpoints<br/>con withAuth (JWT + RBAC + rate-limit)"]
    wh["Webhooks públicos<br/>/api/webhooks/asaas · /api/webhooks/whatsapp<br/>/api/healthz"]
  end

  subgraph libs["📦 Capa de servicios — src/lib"]
    wa["withAuth — api-handler.ts<br/>valida JWT → lee user_roles<br/>inyecta ctx.auth {tenantId, role, userId}"]
    sup["Cliente anónimo (supabase.ts)<br/>Cliente service-role (supabaseAdmin.ts)"]
    asaas["asaasClient.ts<br/>credenciales por tenant"]
    fisc["fiscal/focusnfe.ts<br/>facturación electrónica"]
    wapp["whatsappAgent.ts<br/>triaje automático de mensajes"]
  end

  subgraph ext["🔌 Servicios externos"]
    sb[("Supabase<br/>Auth · Postgres + RLS · Storage")]
    as[("Asaas<br/>PIX · boleto · cobranzas")]
    fn[("FocusNFE<br/>CFDI / facturación")]
    ev[("Evolution API<br/>WhatsApp")]
    kv[("Upstash KV<br/>rate limiting")]
  end

  pub --> mw
  dash --> mw
  mw --> api
  mw --> wh
  dash --> sup
  api --> wa
  wa --> sup
  wa --> kv
  api --> asaas
  api --> fisc
  api --> wapp
  wh --> asaas
  wh --> wapp
  wh --> kv
  sup --> sb
  asaas --> as
  fisc --> fn
  wapp --> ev

  classDef pub fill:#eef2ff,stroke:#6366f1,color:#312e81
  classDef ext fill:#ecfdf5,stroke:#059669,color:#064e3b
    class pub,dash pub
  class sb,as,fn,ev,kv ext
```

---

## 2. Cadena de autenticación y las 4 capas de aislamiento

```mermaid
flowchart LR
  R["Requête autenticada<br/>Authorization: Bearer JWT"] --> RL["Capa 1 — withAuth<br/>rate limit por IP<br/>Upstash KV (300 req/min)"]
  RL -->|"excedido"| RLX["429 + Retry-After"]
  RL -->|"ok"| J["Decodificar JWT<br/>supabaseAdmin.auth.getUser"]
  J -->|"inválido/expirado"| E1["401"]
  J -->|"sin rol"| PEND["403 PENDING_APPROVAL<br/>sin vínculo a tenant"]
  J -->|"2+ vínculos"| MTS["409 MULTI_TENANT_SELECT<br/>seleccionar unidad"]
  J -->|"1 vínculo"| RBAC{"role ∈ allowedRoles<br/>o es superadmin?"}
  RBAC -->|"no"| E2["403 Acesso denegado"]
  RBAC -->|"sí"| H["Handler con ctx.auth<br/>{userId, tenantId, role}"]
  H -->|"cada query"| Q["Capa 2 — filtro obligatorio<br/>.eq('tenant_id', auth.tenantId)"]
  Q -->|"excepción superadmin"| SA["/api/tenants · /api/users/roles<br/>puede pasar tenant_id explícito"]
  Q --> DB[("Capa 4 — Postgres + RLS<br/>policy tenant_isolation:<br/>get_user_tenant_id() OR is_superadmin()")]
```

**Las 4 capas de seguridad que evitan mezclar funerarias (multi-tenancy):**

| Capa | Dónde actúa | Qué hace |
|------|-------------|----------|
| 1. Middleware `withAuth` | Toda API | Decodifica el JWT y extrae `tenantId` + `role` del usuario |
| 2. Filtro obligatorio | Toda query | `.eq('tenant_id', auth.tenantId)` en cada SELECT/UPDATE/DELETE |
| 3. Excepción superadmin | `/api/tenants`, `/api/users/roles` | Solo superadmin puede pasar `tenant_id` ajeno |
| 4. RLS de Postgres | Base de datos | Bloquea en la BD aunque escape del código (fail-closed) |

---

## 3. Mapa de dominios → rutas API

El router de Next.js expone ~55 endpoints bajo `/api/*`. Todos pasan por
`withAuth` (JWT + RBAC + rate-limit) **excepto** los marcados como
**público**. La matriz de roles se resuelve en `src/config/permissions.ts`
y el 2.º argumento de `withAuth(..., ['roles'])` controla el acceso.

```mermaid
flowchart TB
  subgraph dCore["🎯 Núcleo · RBAC y onboarding"]
        api_healthz["/api/healthz<br/>GET (público)"]
        api_init["/api/init-user<br/>GET·POST (público)"]
    api_tenants["/api/tenants<br/>GET·POST·PATCH · superadmin"]
    api_tlogo["/api/tenants/logo<br/>POST · superadmin"]
    api_roles["/api/users/roles<br/>GET·POST·DELETE · superadmin"]
  end

  subgraph dSales["🛒 Ventas · CRM · Leads"]
    api_leads["/api/leads<br/>GET·POST·PATCH·DELETE"]
        api_leadland["/api/leads/landing<br/>POST (público)"]
    api_leadnotes["/api/lead-notes<br/>GET·POST·DELETE"]
    api_sellers["/api/sellers<br/>GET·POST·PATCH·DELETE"]
    api_scomm["/api/sales/commission<br/>GET·PATCH"]
    api_plans["/api/plans<br/>GET·POST·PATCH·DELETE"]
  end

  subgraph dHold["👥 Titulares · Contratos"]
    api_holders["/api/holders<br/>GET·POST·PATCH·DELETE"]
    api_hs["/api/holders/quick-search<br/>GET"]
    api_import["/api/holders/import<br/>POST"]
    api_deps["/api/dependents<br/>GET·POST·PATCH·DELETE"]
    api_contracts["/api/contracts<br/>GET·POST·DELETE"]
    api_elig["/api/contracts/eligibility<br/>GET"]
  end

  subgraph dBilling["💳 Cobranza Asaas"]
    api_gen["/api/billing/generate-cycles<br/>POST"]
    api_batch["/api/billing/asaas-batch<br/>POST"]
    api_avulso["/api/billing/avulso<br/>POST"]
    api_pix["/api/billing/pix<br/>POST"]
    api_boleto["/api/billing/boleto<br/>POST"]
    api_col["/api/billing/collector<br/>GET·POST"]
    api_paypix["/api/payments/pix<br/>POST"]
    api_carnets["/api/payment-carnets<br/>GET·POST·PATCH·DELETE"]
  end

  subgraph dFin["💰 Financiero"]
    api_ftx["/api/financial/transactions<br/>GET·POST·DELETE"]
    api_summary["/api/financial/summary<br/>GET"]
    api_rr["/api/financial/regulatory-reserves<br/>GET"]
    api_ap["/api/accounts-payable<br/>GET·POST·PATCH"]
    api_audit["/api/audit-logs<br/>GET"]
  end

  subgraph dSvc["🏥 Planta · Servicio funerario"]
    api_so["/api/service-orders<br/>GET·POST·PATCH·DELETE"]
    api_ed["/api/emergency-dispatches<br/>GET·PATCH"]
    api_bur["/api/chapel/burials<br/>GET·POST·PATCH·DELETE"]
    api_cb["/api/chapel-bookings<br/>GET·POST·PATCH·DELETE"]
    api_th["/api/thanatopraxy<br/>GET·POST"]
    api_dc["/api/dispatches/close<br/>POST"]
    api_da["/api/dispatches/audit<br/>POST·GET"]
    api_cr["/api/collector-routes<br/>GET·POST"]
    api_veh["/api/vehicles<br/>GET·POST·PATCH·DELETE"]
    api_inv["/api/inventory<br/>GET·POST"]
    api_ded["/api/stock/dispatch-deduct<br/>POST"]
  end

  subgraph dBenf["🎁 Beneficios · Convalescencia"]
    api_bp["/api/benefits/partners<br/>GET·POST·PATCH·DELETE"]
    api_conv["/api/convalescence<br/>GET·POST"]
  end

  subgraph dFisc["🧾 Fiscal"]
    api_fc["/api/fiscal/config<br/>PATCH·GET"]
    api_fe["/api/fiscal/emit<br/>POST"]
    api_fx["/api/fiscal/cancel<br/>POST"]
    api_fl["/api/fiscal/list<br/>GET"]
    api_ft["/api/fiscal/test<br/>POST"]
  end

  subgraph dWh["📡 Webhooks · Infra"]
        api_wa["/api/webhooks/asaas<br/>POST (público)"]
        api_ww["/api/webhooks/whatsapp<br/>POST (público)"]
    api_we["/api/webhooks/events<br/>GET"]
    api_wr["/api/webhooks/retry<br/>POST"]
    api_kpi["/api/dashboard/kpis<br/>GET"]
  end

  classDef pub fill:#fef9c3,stroke:#ca8a04,color:#713f12
  class api_healthz,api_init,api_leadland,api_wa,api_ww pub

        linkStyle default stroke:#94a3b8,stroke-width:1px
    %% Los subgraphs agrupan visualmente por dominio; la clase pub resalta rutas públicas.
```

#### Tabla de referencia (ruta / métodos / notas)

| Ruta (`src/app/api`) | Métodos | Público / Auth | Notas |
|---|---|---|---|
| `/healthz` | GET | **Público** | Sin auth ni BD (uptime monitor) |
| `/init-user` | GET, POST | **Público** (con token) | Lee estado de rol del usuario logueado |
| `/webhooks/asaas` | POST | **Público** (token + whitelist IP) | Conciliación de pagos |
| `/webhooks/whatsapp` | POST | **Público** (token) | Webhook del agente de triaje |
| `/webhooks/events` | GET | Auth | Eventos internos / polling |
| `/webhooks/retry` | POST | Auth (admin) | Reintento manual de webhooks fallidos |
| `/tenants` (+ `/logo`) | GET, POST, PATCH | Auth (superadmin) | CRUD funerarias + cambio de plan |
| `/users/roles` | GET, POST, DELETE | Auth (superadmin) | Concesión/revocación de roles |
| `/leads/landing` | POST | **Público** | Captación de leads (landing) |
| `/leads`, `/lead-notes` | CRUD | Auth | Funnel de ventas |
| `/sellers`, `/sales/commission` | CRUD / get+patch | Auth | Comisión de vendedores |
| `/plans` | CRUD | Auth | Planos de mensualidad |
| `/holders` (+ quick-search, import), `/dependents` | CRUD | Auth | Titulares y dependientes |
| `/contracts` (+ eligibility) | GET, POST, DELETE / GET | Auth | Activos/contratos (elegibilidad) |
| `/billing/*` | POST (collector: GET) | Auth | Generación y cobro Asaas |
| `/payments/pix`, `/payment-carnets` | POST / CRUD | Auth | Cobro PIX y parcelamento anual |
| `/financial/*` | CRUD / GET | Auth | Livro caja + reservas regulatorias |
| `/accounts-payable`, `/audit-logs` | get+post / GET | Auth | Cuentas a pagar; auditoría |
| `/service-orders`, `/emergency-dispatches` | CRUD / get+patch | Auth | Órdenes de atención 24 h |
| `/chapel/burials`, `/chapel-bookings`, `/thanatopraxy` | CRUD/CRUD/get+post | Auth | Sepultamientos, capilla, tanatopraxia |
| `/dispatches/*`, `/collector-routes`, `/vehicles`, `/inventory`, `/stock/*` | POST/get+post/CRUD/get+post/POST | Auth | Logística y flota |
| `/benefits/partners`, `/convalescence` | CRUD / get+post | Auth | Beneficios y convalescencia |
| `/fiscal/*` | PATCH,GET / POST ×3 / GET | Auth | Facturación fiscal (FocusNFE) |
| `/dashboard/kpis` | GET | Auth | KPIs tablero principal |

Todas las rutas *auth* pasan por `withAuth`; la matriz de roles vive en
`src/config/permissions.ts` y el 2.º argumento de `withAuth(handler, ['roles'])`
es el allowlist.

---

## 4. Capas de librerías (src/lib) y servicios

```mermaid
flowchart TB
  subgraph libs["src/lib — capa de servicios"]
    apihandler["api-handler.ts<br/>withAuth"]
    apilog["http-error.ts<br/>logError / serverError"]
    rl["rate-limiter.ts<br/>Upstash KV"]
    supC["supabaseClient.ts<br/>JWT anónico"]
    supA["supabaseAdmin.ts<br/>service-role"]
    asaas["asaasClient.ts<br/>config por tenant"]
    fin["financial.ts<br/>recordIncome, summary"]
    comm["commissions.ts"]
    crm["crm.ts"]
    fisc["fiscal/focusnfe.ts"]
    wapp["whatsapp.ts"]
    waget["whatsappAgent.ts<br/>bot de triaje"]
    notify["notify.ts<br/>toasts (sonner)"]
    plan["planLimits.ts"]
    elig["eligibility.ts"]
    val["validation.ts<br/>+ formValidation.ts"]
    authF["authFetch.ts"]
    print["printReports.ts"]
  end

  apihandler --> supA
  apihandler --> rl
  apihandler --> apilog
  rl --> KV[("Upstash KV")]
  supA --> SB[("Supabase<br/>Postgres + Auth")]
  supC --> supA
  asaas --> supA
  asaas --> ENV["process.env<br/>ASAAS_API_KEY/ENV/ALLOWED_IPS"]
  fin --> supA
  comm --> supA
  fisc --> FN[("FocusNFE<br/>facturación")]
  wapp --> WA[("Evolution API<br/>WhatsApp")]
  waget --> wapp

  apihandler -.-> asaas
  apihandler -.-> fin
  apihandler -.-> waget
  authF -.-> supC

  classDef lib fill:#eff6ff,stroke:#2563eb
  classDef ext fill:#ecfdf5,stroke:#059669
  class apihandler,apilog,rl,supC,supA,asaas,fin,comm,crm,fisc,wapp,waget,notify,plan,elig,val,authF,print lib
  class KV,SB,ENV,FN,WA ext
  linkStyle default stroke:#94a3b8
```

**Relaciones de dependencia clave**

- `api-handler.ts` es el **núcleo de backend**: `withAuth` consume
  `supabaseAdmin` (Auth), `rate-limiter` (Upstash KV) e `http-error`.
- La **capa de datos** está dividida: `supabase.ts`/`supabaseClient.ts`
  para el cliente anónimo (UI) y `supabaseAdmin.ts` (service-role) para el
  backend con RLS bypass → siempre filtrando por `tenant_id`.
- Los **servicios externos** salen centralizados desde `lib`:
    Asaas (`asaasClient`), FocusNFE (`fiscal/`), WhatsApp (`whatsappAgent`),
  KV (`rate-limiter`).

---

## 5. Frontend — páginas, componentes y contexto

```mermaid
flowchart LR
  subgraph pub["Publicas / sin auth"]
    landing["/landing<br/>landing/page.tsx"]
    login["/login<br/>login/page.tsx"]
    cart["/carteirinha/[cpf]<br/>carta pública por CPF"]
  end
  subgraph app["App (dashboard monolito)"]
    page["/ (dashboard)<br/>src/app/page.tsx<br/>~5110 líneas · tabs RBAC"]
    guard["components/AuthGuard.tsx<br/>+ withAuth client side"]
  end
  subgraph tabs["Tabs / Modales"]
    tSellers["components/tabs/SellersTab"]
    tFiscal["components/tabs/FiscalTab"]
    tPlans["components/tabs/PlansTab"]
    tCrm["components/tabs/CrmTab"]
    tTenant["components/tabs/TenantSettingsTab"]
    tFiscalSet["components/tabs/FiscalSettingsSection"]
    mRBAC["components/dashboard/ModalRBAC"]
    mDRE["components/dashboard/ModalDRE"]
    mWh["components/dashboard/ModalWebhookRetry"]
    mChap["components/modals/ModalChapel"]
    mCarnets["components/modals/ModalCarnets"]
    mCob["components/modals/ModalCobrancaAvulsa"]
  end
  subgraph ctx["Estado y permisos"]
    perm["config/permissions.ts<br/>roles, isTabAllowed, hasPermission"]
    tenantCtx["contexts/TenantContext.tsx<br/>tenant + branding"]
    useB["hooks/useBilling.ts<br/>generación de cobros"]
    theme["components/ThemeToggle.tsx + ServiceWorkerRegister"]
  end

  landing --> login
  login --> app
  cart --> app
  app --> page
  page --> guard
  page --> perm
  page --> tenantCtx
  page --> useB
  page --> tabs
  page --> ctx
  page --> supC["@/lib/supabase (anon)"]
  page <--> wapp2["@/lib/whatsapp"]
  page <--> print["@/lib/printReports.ts"]
  page <--> notif["@/lib/notify"]

  classDef p2 fill:#fef9c3,stroke:#ca8a04
  classDef a2 fill:#f0f9ff,stroke:#0284c7
  classDef l2 fill:#f1effd,stroke:#6d28d9
  class landing,login,cart p2
  class page,guard a2
  class tSellers,tFiscal,tPlans,tCrm,tTenant,tFiscalSet,mRBAC,mDRE,mWh,mChap,mCarnets,mCob l2
  class perm,tenantCtx,useB,theme l2
  linkStyle default stroke:#94a3b8
```

**Notas clave del frontend**

- El **único punto de entrada UI** es `src/app/page.tsx` (dashboard monolítico). Los
  módulos de negocio (`billing`, `contracts`, `holders`, …) son **pestañas** cargadas
  condicionalmente según rol, resguardadas por `AuthGuard` + `isTabAllowed`
  (`src/config/permissions.ts`).
- La **carta de vacunación** (`/carteirinha/[cpf]`) y `landing` son públicas; `login`
  es la puerta de entrada.
- `components/modais` (ModalChapel, ModalCarnets, …) encapsulan los sub-flujos
  del servicio funerario (capilla, parcelas, cobro avulso).

---

## 6. Modelo de datos (ERD)

Banco compartido multi-tenant: **todas** las tablas tienen `tenant_id → tenants`.
Los 2.º nivel (comissions, benefits, etc.) se listan al pie.

```mermaid
erDiagram
    TENANTS ||--o{ PLANS : ""
  TENANTS ||--o{ HOLDERS : ""
  TENANTS ||--o{ DEPENDENTS : ""
  TENANTS ||--o{ CONTRACTS : ""
  TENANTS ||--o{ PAYMENTS : ""
  TENANTS ||--o{ PAYMENT_CARNETS : ""
  TENANTS ||--o{ FINANCIAL_TRANSACTIONS : ""
  TENANTS ||--o{ INVENTORY : ""
  TENANTS ||--o{ VEHICLES : ""
  TENANTS ||--o{ DISPATCHES : ""
  TENANTS ||--o{ SERVICE_ORDERS : ""
  TENANTS ||--o{ SERVICE_ORDER_ITEMS : ""
  TENANTS ||--o{ CHAPEL_BURIALS : ""
  TENANTS ||--o{ THANATOPRAXY_RECORDS : ""
  TENANTS ||--o{ EMERGENCY_DISPATCHES : ""
  TENANTS ||--o{ SELLERS : ""
  TENANTS ||--o{ COMMISSIONS : ""
  TENANTS ||--o{ REGULATORY_RESERVES : ""

  HOLDERS ||--o{ DEPENDENTS : "tiene"
  HOLDERS ||--o{ CONTRACTS : "firma"
  CONTRACTS ||--o{ PAYMENTS : "genera"
  CONTRACTS ||--o{ PAYMENT_CARNETS : "parcela"
  CONTRACTS ||--o{ SERVICE_ORDERS : "origen"
  CONTRACTS ||--o{ CHAPEL_BURIALS : "sepultura"
  CONTRACTS ||--o{ EMERGENCY_DISPATCHES : "urgencia"
  PLANES ||--o{ CONTRACTS : "tipo"
  PAYMENTS ||--o{ FINANCIAL_TRANSACTIONS : "concilia"
  CHAPEL_BURIALS ||--o{ THANATOPRAXY_RECORDS : "registra"
  VEHICLES ||--o{ DISPATCHES : "asigna"
  SERVICE_ORDERS ||--o{ SERVICE_ORDER_ITEMS : "contiene"
  INVENTORY ||--o{ SERVICE_ORDER_ITEMS : "consumido por"

  TENANTS ||--o{ USER_ROLES : "posee usuarios"
  USERS_AUTH ||--o{ USER_ROLES : "auth.users (Supabase Auth)"

  TENANTS {
    uuid id PK
    varchar cnpj
    varchar commercial_plan
    text asaas_api_key
    varchar pix_key
    timestamptz created_at
  }
  USER_ROLES {
    uuid id PK
    uuid user_id FK
    uuid tenant_id FK
    varchar role
  }
  HOLDERS {
    uuid id PK
    uuid tenant_id FK
    varchar full_name
    varchar cpf
  }
  CONTRACTS {
    uuid id PK
    uuid holder_id FK
    uuid plan_id FK
    varchar status
  }
  PAYMENTS {
    uuid id PK
    uuid contract_id FK
    varchar asaas_payment_id
    numeric amount
    varchar status
  }
  SERVICE_ORDERS {
    uuid id PK
    uuid contract_id FK
    uuid vehicle_id FK
    varchar status
  }
  INVENTORY {
    uuid id PK
    varchar category
    int stock_quantity
  }
```

Tablas auxiliares (todas con `tenant_id → tenants`, omitidas del ERD por claridad):
`benefits_partners`, `accounts_payable`, `asaas_customers`, `audit_logs`,
`chapel_bookings`, `collector_routes`, `convalescence_items`,
`convalescence_loans (item_id → convalescence_items)`, `fleet_vehicles`
(concepto duplicado con `vehicles`), `dispatch_audit_logs`, `fiscal_invoices`,
`tenant_whatsapp_numbers`, `whatsapp_agent_sessions`.

**RLS definitivo** (véase `eternityos_schema.sql`): función `get_user_tenant_id()` y
`is_superadmin()` aplicadas vía `policy tenant_isolation` en cada tabla, más
política `user_roles_self_read` (cada usuario ve su propio rol).

---

## 7. Flujo: atención de un óbito (plantón 24 h)

Flujo completo documentado en `ARQUITETURA-RBAC-MULTITENANT.md` y orquestado desde
`/api/service-orders`, que integra contrato, flota y stock.

```mermaid
sequenceDiagram
  autonumber
  participant Op as Operador (plantón)
  participant UI as Dashboard (page.tsx)
  participant SO as /api/service-orders
  participant DB as Postgres (RLS, tenant_id)
  participant Flota as /api/vehicles
  participant Inv as /api/inventory · stock/dispatch-deduct
  participant Cap as /api/chapel/burials
  participant Tan as /api/thanatopraxy

  Op->>UI: "+ Registrar chamado" + datos fallecido + contrato
  UI->>SO: POST /service-orders (verificar elegibilidad vía /contracts/eligibility)
  SO->>DB: crear OS filtrada por tenant_id
  SO->>Flota: buscar vehículo disponible
  Flota->>DB: UPDATE vehicles status = "En misión"
  SO->>Inv: POST /stock/dispatch-deduct (decaer stock: urna, etc.)
  Inv->>DB: decrementar stock_quantity (fail-closed >=0)
  SO->>Cap: POST /chapel/burials (programar sepultamento contract_id)
  Cap->>DB: crear registro capilla
  Op->>UI: registrar tanatopraxia
  UI->>Tan: POST /thanatopraxy
  Tan->>DB: crear registro vinculado a burial_id
  Op->>UI: "+ Cerrar despacho"
  UI->>DB: PATCH dispatches/close → status "Disponible" (vehículo vuelve a disponible)
  Note right of DB: Todo filtrado por tenant_id<br/>+ política RLS tenant_isolation
```

---

## 8. Flujo: cobranza y conciliación Asaas

```mermaid
sequenceDiagram
  autonumber
  participant Cron as Cron/batch (admin)
  participant BATCH as /api/billing/generate-cycles
  participant AA as Asaas (api.asaas.com)
  participant WH as /api/webhooks/asaas (público)
  participant PAY as /api/payments (conciliación)
  participant FIN as /api/financial/transactions · recordIncome
  participant DB as Postgres (payments, financial_transactions)
  participant COM as /lib/commissions.ts

  Cron->>BATCH: POST /generate-cycles (tenant_id)
  BATCH->>AA: crear facturas PIX/boleto (api_key del tenant)
  AA-->>BATCH: 200 / cobranzas creadas
  BATCH->>DB: INSERT payments (status: pending)

  rect rgb(255,255,245)
  Note over AA,WH: Pago realizado por el titular
  AA->>WH: POST webhook PAYMENT_RECEIVED<br/>header asaas-access-token
  WH->>WH: validar token + whitelist IP + rate-limit
  WH->>PAY: actualizar payment.status = paid / paid_at
  PAY->>FIN: recordIncome → INSERT financial_transactions (income)
  PAY->>DB: actualizar kpis / contrato (regla de limites)
  end

  rect rgb(240,255,247)
  Note over PAY,COM: Conciliación contable
  PAY->>COM: generateCommission (vendedor)
  COM->>DB: INSERT commissions
  end
```

**Seguridad del webhook Asaas** (sin autenticación JWT):
validación por **token** (`asaas-access-token`), **whitelist de IPs**
(`ASAAS_ALLOWED_IPS`) y **rate-limit por IP** — el HMAC anterior era
*código muerto* y fue eliminado (ver histórico de `fix_vazamento`).

---

## 9. Anexo — cómo regenerar y resumen

### Re-generar el mapa de rutas (script de extracción)

```powershell
# Ruta API: lista de endpoints
git -C C:\Users\User\eternitysos ls-files 'src/app/api/*' | Sort-Object

# Métodos HTTP por endpoint
$api = git -C C:\Users\User\eternitysos ls-files 'src/app/api/*/route.ts' 'src/app/api/*/*/route.ts'
foreach ($f in $api) {
  $m = (Get-Content "C:\Users\User\eternitysos\$f" |
        ? { $_ -match '^export const (GET|POST|PATCH|PUT|DELETE)' } |
        % { ($_ -replace '^export const (\w+).*','$1') }) -join ','
  "$f -> $m"
}

# Librerías / contextos / módulos
git -C C:\Users\User\eternitysos ls-files 'src/lib/*' 'src/config/*' 'src/contexts/*' 'src/hooks/*' |
  Sort-Object
```

Vuelve a renderizar este `.md` y todos los diagramas se actualizan.

### Stack resumido

| Capa | Tecnología | Archivo/entrada clave |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | `src/app/**` |
| Auth / DB | Supabase (Auth + Postgres) | `lib/supabase[Admin|Client].ts` |
| Cobranzas | Asaas API v3 | `lib/asaasClient.ts`, `api/billing/*` |
| Fiscal | FocusNFE | `lib/fiscal/focusnfe.ts`, `api/fiscal/*` |
| WhatsApp | Evolution API (agente de triaje) | `lib/whatsappAgent.ts`, `api/webhooks/whatsapp` |
| Rate limit | Upstash KV | `lib/rate-limiter.ts` |
| UI | Tailwind 3 + lucide-react + recharts | `src/app/page.tsx` |
| Testing | Jest | `src/app/api/routes-*.test.ts`, `src/config/permissions.test.ts` |
| Seguridad | CSP nonce + headers duros (middleware) + RLS | `src/middleware.ts` + `eternityos_schema.sql` |

### Artefactos relacionados

- [`ARQUITETURA-RBAC-MULTITENANT.md`](./ARQUITETURA-RBAC-MULTITENANT.md) — guía didáctica RBAC/multi-tenancy/onboarding.
- [`eternityos_schema.sql`](../eternityos_schema.sql) — schema SQL completo con políticas RLS.
- [`ROADMAP-PENDENTES.md`](./ROADMAP-PENDENTES.md) — backlog y prioridades.
- [`CHECKLIST-MANUAL-SEGURANCA.md`](./CHECKLIST-MANUAL-SEGURANCA.md) — auditoría de segurança.