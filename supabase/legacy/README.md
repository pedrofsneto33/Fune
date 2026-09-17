# supabase/legacy/ — SQLs históricos (NÃO EXECUTAR)

Este diretório guarda SQLs que contam a história do projeto:
diagnósticos do incidente de vazamento de tenant (set/2026) e
tentativas de correção de RLS. **NÃO SÃO MIGRATIONS.** Não
reaplicar. Não referenciar em código.

## Categorias

### Diagnósticos (só leitura — podem rodar contra o remoto)
`diag*.sql`, `bloco1.sql`, `bloco2.sql`, `auditoria_completa.sql`,
`verificar_rls*.sql`

### Fixes de RLS / vazamento (aplicados em set/2026)
`fix_rls_*.sql`, `fix_vazamento*.sql`

Aplicados via SQL Editor (não versionados como migration).
Superados pelas policies atuais. **NÃO REAPLICAR.**

### Schema superado
`eternityos_schema.sql` — schema completo de 10/09, substituído
pelo dump versionado `20260914220043_remote_schema.sql`.

### Migrations já refletidas no remoto
`migracao_planos_supabase.sql` — altera `tenants` (apesar do
nome). Já aplicado.

### ⚠️ PERIGOSO — NÃO EXECUTAR
`migracao_storage_logos.DO-NOT-RUN.sql` — cria o bucket
`tenant-logos` (nome correto) MAS tambem cria policies de
INSERT/UPDATE que **contrariam o hardening atual**. No remoto
hoje so existe a policy de leitura `tenant_logos_public_read`.
Reaplicar reintroduziria escrita direta para autenticados.

## Referência
Ver `docs/JORNADA-GRAPHIFY-E-REFATORACAO.md` (§11 Bugs conhecidos)
para o contexto do incidente de RLS.
