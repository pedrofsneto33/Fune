# 🔧 CHECKLIST MANUAL — Ações que só VOCÊ pode fazer

> **Guia passo a passo gerado após a auditoria de segurança (commit `628b620`).**
> As correções automáticas já estão no ar. O que sobra são ações **dentro dos painéis**
> (Supabase, Vercel, Asaas, GitHub) que exigem suas credenciais — nenhuma IA ou script
> deve ter acesso a elas.

---

## 📋 Resumo rápido (ordem de prioridade)

| # | Ação | Urgência | Tempo estimado |
|---|------|----------|----------------|
| 1 | Rotacionar chaves do Supabase | 🔴 **URGENTE — hoje** | 5 min |
| 2 | Atualizar as novas chaves na Vercel e no `.env.local` | 🔴 **Urgente (junto com o 1)** | 5 min |
| 3 | Conferir RLS em todas as tabelas | 🟠 Alta | 10 min |
| 4 | Configurar `ASAAS_WEBHOOK_SECRET` | 🟠 Média | 5 min |
| 5 | Ativar 2FA (GitHub, Vercel, Supabase) | 🟠 Média | 10 min |
| 6 | Habilitar backups automáticos (PITR) | 🟡 Média | 5 min |
| 7 | Limpar histórico do git (chaves antigas) | 🟡 Opcional | 20 min |
| 8 | Pendência funcional: botão "Asaas em Lote" | 🟢 Decisão de negócio | — |
| 9 | LGPD: política de privacidade e consentimento | 🟢 Longo prazo | — |

---

## 1️⃣ ROTACIONAR AS CHAVES DO SUPABASE — 🔴 URGENTE

### Por que isso é urgente?

As chaves do Supabase (service_role e anon) **ficaram commitadas no histórico do git**
por um período. Mesmo tendo sido removidas dos arquivos, elas continuam **para sempre
no histórico** — qualquer pessoa que clonar o repositório consegue recuperá-las com
`git log -p`.

A service_role key **ignora toda a segurança (RLS)** — quem a tiver, tem acesso total
ao banco de todas as funerárias.

> **Rotacionar = invalidar a chave antiga e gerar uma nova.** É o único jeito de
> "desvazar" um segredo que já foi exposto.

### Passo a passo

1. Acesse **https://supabase.com/dashboard** e faça login
2. Selecione o projeto **plvrapxybhdnwmquossb** (EternitySOS)
3. No menu lateral esquerdo, clique em **⚙️ Project Settings** (ícone de engrenagem)
4. Clique em **API**
5. Você verá duas chaves na área **Project API Keys**:
   - `anon` `public` — chave pública do frontend
   - `service_role` — chave **secreta** do servidor ⚠️
6. **Role até o fim da página** e procure **"Rotate Keys"** (ou clique nos **três pontinhos** ⋯ ao lado de cada chave → **Rotate**)
7. O Supabase vai perguntar se tem certeza — confirme
8. **Copie as duas chaves NOVAS** e guarde num lugar seguro (bloco de notas temporário)

> ⚠️ **IMPORTANTE:** a partir do momento que você rotaciona, a chave ANTIGA para de
> funcionar **imediatamente**. O app vai parar de responder até você fazer o passo 2.
> Faça os passos 1 e 2 em sequência, sem pausa.

---

## 2️⃣ ATUALIZAR AS CHAVES NOVAS — 🔴 (fazer logo após o passo 1)

### A) Na Vercel (produção)

1. Acesse **https://vercel.com/dashboard** e faça login
2. Clique no projeto **eternitysos**
3. Aba **Settings** → **Environment Variables**
4. Localize e **edite** estas variáveis (clique nos 3 pontinhos ⋯ → Edit):
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → cole a **anon NOVA**
   - `SUPABASE_SERVICE_ROLE_KEY` → cole a **service_role NOVA**
     (se o nome for diferente na sua lista — ex: `SUPABASE_SERVICE_ROLE` — edite a que existir)
5. Clique em **Save** em cada uma
6. Aba **Deployments** → localize o deploy mais recente → **⋯ → Redeploy** → confirme
   *(necessário para o novo valor de `NEXT_PUBLIC_*` valer — variáveis públicas só entram em vigor em novo build)*

### B) No seu computador (desenvolvimento)

1. Abra o arquivo `C:\Users\User\eternitysos\.env.local` no VS Code
2. Atualize as linhas com as chaves novas:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://plvrapxybhdnwmquossb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<COLE_A_ANON_NOVA_AQUI>
   SUPABASE_SERVICE_ROLE_KEY=<COLE_A_SERVICE_ROLE_NOVA_AQUI>
   ```
3. Salve o arquivo
4. Se o `npm run dev` estiver rodando, **reinicie** (Ctrl+C e `npm run dev` de novo)

### C) Testar se voltou ao ar

1. Abra **https://eternitysos.vercel.app** (ou sua URL de produção)
2. Faça login — deve carregar os dados normalmente
3. Abra **http://localhost:3000** e faça login também

> ✅ Se ambos funcionaram: as chaves vazadas estão mortas e o risco crítico está **fechado**.


---

## 3️⃣ CONFERIR RLS (ROW LEVEL SECURITY) EM TODAS AS TABELAS

### Por quê?

O frontend usa a `anon key` (pública, visível no navegador). O que impede um usuário
mal-intencionado de consultar/editar dados direto do navegador com ela é o **RLS**.
As APIs do servidor usam `service_role` (que ignora RLS), então habilitar RLS **não
quebra o app** — só protege a porta aberta do navegador.

### Passo a passo

1. No **Supabase Dashboard**, abra **SQL Editor** (ícone de terminal no menu lateral)
2. Cole e execute esta query para ver o status de todas as tabelas:

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

3. Toda linha com `rowsecurity = false` é uma **porta aberta** ⚠️
4. Para habilitar RLS em cada tabela faltante, execute (substitua o nome):

   ```sql
   ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
   ```

5. **Me mande o resultado da query do passo 2** — as tabelas que precisam de policies
   de leitura/escrita para o frontend eu te devolvo o SQL das policies prontas. As
   demais ficam **sem policy nenhuma** (negada por padrão = mais seguro).

---

## 4️⃣ CONFIGURAR O SEGREDO DO WEBHOOK DO ASAAS

### Por quê?

O webhook do Asaas é um endpoint **público** (o Asaas precisa conseguir chamá-lo).
A auditoria corrigiu o código para **exigir assinatura HMAC** quando o segredo existe,
mas o segredo ainda não foi configurado — hoje o webhook valida pelo token por tenant
(aceitável, porém menos blindado).

### Passo a passo

1. Acesse **https://www.asaas.com** e faça login na conta **da sua plataforma**
2. Menu **Integrações** → **Webhooks** (ou Configurações → Webhooks)
3. Se já existe um webhook apontando para sua URL, abra para editar; senão, clique em
   **+ Adicionar webhook**
4. Configure:
   - **URL:** `https://eternitysos.vercel.app/api/webhooks/asaas`
   - **Versão da API:** a mais recente disponível
   - **Eventos:** `PAYMENT_CREATED`, `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`,
     `PAYMENT_OVERDUE`, `PAYMENT_DELETED` (mínimo recomendado)
5. No campo **Chave de assinatura / Secret / Token HMAC**, copie o valor exibido
   (ou clique em "gerar") — **este é o `ASAAS_WEBHOOK_SECRET`**
6. Na **Vercel**: projeto → Settings → Environment Variables → **Add New**:
   - Name: `ASAAS_WEBHOOK_SECRET`
   - Value: *(cole o segredo copiado)*
   - Environments: ✅ Production ✅ Preview ✅ Development
7. Salve e faça um **Redeploy** (mesmo caminho do passo 2A-6)
8. No painel do Asaas, use **"Enviar evento de teste"** e confirme que chega `200 OK`

---

## 5️⃣ ATIVAR AUTENTICAÇÃO EM 2 FATORES (2FA)

Contas de administrador sem 2FA são o vetor mais comum de tomada de conta de SaaS.

### GitHub

1. Canto superior direito → foto de perfil → **Settings**
2. **Password and authentication** → **Enable two-factor authentication**
3. Escolha **Auth app** (Google Authenticator / Authy) — escaneie o QR Code
4. **Guarde os códigos de recuperação** em lugar seguro (usados se perder o celular)

### Vercel

1. Foto de perfil → **Account Settings** → **Authentication**
2. **Two-Factor Authentication** → **Enable** → escolha o método (app autenticador)
3. Salve os códigos de recuperação

### Supabase

1. Canto superior direito → avatar → **Account Preferences**
2. **Security** → **Two-factor authentication** → **Add**
3. Escaneie o QR Code e salve os códigos de recuperação

---

## 6️⃣ BACKUPS AUTOMÁTICOS DO BANCO

### Por quê?

Hoje, se alguém (ou um bug) apagar dados, **não há como recuperar** — não existe
histórico. Com PITR (Point-In-Time Recovery), você restaura o banco em qualquer
minuto dos últimos N dias.

### Passo a passo

1. **Supabase Dashboard** → projeto → **Database** (menu lateral)
2. Aba **Backups**
3. Verifique o plano atual:
   - Plano **Pro** ou superior → ative **PITR** (recuperação por minuto)
   - Plano **Free** → não tem backup automático; faça backup manual **semanal**:
     - Database → **Backups** → **Create backup**
     - ou via CLI no terminal do projeto: `supabase db dump -f backup.sql`
4. Anote no calendário: se estiver no plano Free, **backup manual toda segunda-feira**

---

## 7️⃣ LIMPAR O HISTÓRICO DO GIT (OPCIONAL)

> ⚠️ **Só faça DEPOIS de rotacionar as chaves (passo 1)!** A rotação já neutraliza
> o perigo; limpar o histórico é uma camada extra de higiene.

### Passo a passo (usando git filter-repo)

1. Instale a ferramenta (uma vez só):
   ```
   pip install git-filter-repo
   ```
2. No diretório do projeto, crie um arquivo `replacements.txt` com a chave ANTIGA
   (a que vazou), seguida de `==>REMOVIDO`:
   ```
   eyJ...cole_a_chave_antiga_completa_aqui...o0==>REMOVIDO
   ```
3. Rode:
   ```
   git filter-repo --replace-text replacements.txt --force
   ```
4. Re-adicione o remote (o filter-repo remove) e force o push:
   ```
   git remote add origin https://github.com/pedrofsneto33/Fune.git
   git push origin main --force
   ```
5. Na Vercel, faça um Redeploy

> ⚠️ **Avisos:** isso reescreve TODOS os commits (os hashes mudam) e invalida clones
> antigos — outros computadores precisarão clonar de novo. **Faça manualmente e com
> calma** — é destrutivo e irreversível.

---

## 8️⃣ DECISÃO: BOTÃO "GERAR COBRANÇAS EM LOTE (ASAAS)"

### O problema

A auditoria constatou que o endpoint `/api/billing/asaas-batch` **retorna "sucesso"
mas não cria cobrança nenhuma** — é um stub que só conta contratos. O dono da
funerária clica, vê "✓ Sucesso" e **acha** que gerou carnês, quando não gerou nada.

### Opções (escolha uma e me diga)

- **A) Integrar de verdade** *(recomendado)* — crio cobranças reais via API do Asaas
  usando as chaves por tenant que já existem em `tenants.asaas_api_key`
- **B) Desabilitar o botão** — escondo da UI com aviso "em breve" até a integração
  ficar pronta *(mais rápido, sem risco de enganar o cliente)*

---

## 9️⃣ LGPD — CONFORMIDADE (LONGO PRAZO)

O sistema armazena **dados sensíveis de saúde** (thanatopraxy) e dados de pessoas
falecidas + familiares. Pela LGPD isso exige, no mínimo:

| Item | O quê fazer | Quando |
|------|-------------|--------|
| Política de Privacidade | Página pública descrevendo coleta, uso e retenção | Antes de escalar clientes |
| Consentimento explícito | Checkbox no cadastro do titular + no contrato | Antes de escalar |
| DPO / encarregado | Definir quem responde a pedidos de titulares | Antes de escalar |
| Direito de exclusão | Fluxo para apagar dados de um titular a pedido | Médio prazo |
| Retenção | Definir por quanto tempo guardar registro de óbito (consultar jurídico) | Médio prazo |
| Contrato de operador | Termo com as funerárias (você processa dados em nome delas) | Antes de escalar |

> 💡 Quando for tratar isso, me avise — eu implemento a página de política, o
> checkbox de consentimento e o fluxo de exclusão no sistema.

---

## ✅ Depois de terminar, me confirme:

1. **"Chaves rotacionadas"** — eu rodo uma verificação no banco e no app para
   confirmar que tudo continua funcionando
2. **Resultado da query de RLS** (item 3, passo 2) — eu te devolvo o SQL de
   policies pronto para colar
3. **Opção A ou B do item 8** — eu implemento na hora
