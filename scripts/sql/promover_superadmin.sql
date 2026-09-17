-- ==============================================
-- PROMOVE pedrofsneto33@gmail.com a SUPERADMIN
-- Seguro para rodar quantas vezes precisar (idempotente)
-- ==============================================

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
BEGIN
    -- 1. Localiza o usuario pelo email (em auth.users)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower('pedrofsneto33@gmail.com')
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'USUARIO NAO ENCONTRADO: pedrofsneto33@gmail.com. Verifique o email cadastrado.';
    END IF;

    -- 2. Localiza o tenant (funeraria) - usa o primeiro tenant ATIVO
    SELECT id INTO v_tenant_id
    FROM public.tenants
    WHERE status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'NENHUM TENANT ATIVO ENCONTRADO. Cadastre um tenant antes.';
    END IF;

    -- 3. Faz upsert (insere se nao existir, atualiza se ja existir)
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (v_user_id, v_tenant_id, 'superadmin')
    ON CONFLICT (user_id, tenant_id)
    DO UPDATE SET role = 'superadmin';

    RAISE NOTICE 'USUARIO % promovido a superadmin no tenant %', v_user_id, v_tenant_id;
END $$;

-- 4. Confere o resultado
SELECT ur.user_id, u.email, ur.tenant_id, t.name AS tenant_name, ur.role, ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN public.tenants t ON t.id = ur.tenant_id
WHERE lower(u.email) = lower('pedrofsneto33@gmail.com');