-- Diagnostico de seguranca - rode no SQL Editor
-- 1) Todas as policies de holders
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename='holders';

-- 2) Verificar se qa.cliente tem is_superadmin = true (seria um problema!)
SELECT ur.user_id, ur.role, ur.tenant_id, u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'qa.cliente@exemplo.com';

-- 3) Testar a funcao is_superadmin() retornada pelo auth.uid() do cliente
SELECT ur.role, ur.tenant_id FROM user_roles ur WHERE ur.user_id = (
  SELECT id FROM auth.users WHERE email = 'qa.cliente@exemplo.com'
);
