-- 4d-1: hardening superadmin global vs superadmin de tenant.
-- Hoje QUALQUER role='superadmin' bypassa withAuth (risco de
-- vazamento horizontal se um tenant tiver superadmin).
-- Adiciona flag is_global; so quem tem is_global=true bypassa.
-- is_superadmin() tambem passa a exigir a flag (RLS mais estrita).

ALTER TABLE "public"."user_roles"
  ADD COLUMN "is_global" boolean NOT NULL DEFAULT false;

-- Backfill: o dono da plataforma vira global.
UPDATE "public"."user_roles"
SET "is_global" = true
WHERE "role" = 'superadmin'
  AND "user_id" = (
    SELECT id FROM auth.users WHERE email = 'pedrofsneto33@gmail.com'
  );

-- Tightening: RLS passa a exigir is_global (nao so role).
CREATE OR REPLACE FUNCTION public.is_superadmin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
 AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'superadmin'
          AND is_global = true
    );
$function$;
