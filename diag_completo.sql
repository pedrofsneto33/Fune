SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename='holders';
SELECT ur.user_id, ur.role, ur.tenant_id, u.email FROM user_roles ur JOIN auth.users u ON u.id = ur.user_id WHERE u.email = 'qa.cliente@exemplo.com';
SELECT role, tenant_id FROM user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'qa.cliente@exemplo.com');