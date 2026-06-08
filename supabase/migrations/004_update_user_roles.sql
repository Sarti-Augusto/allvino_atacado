-- =====================================================================
-- Wine Catalog B2B - Alterar check constraint de roles do admin_users
-- =====================================================================

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('admin', 'representante', 'owner', 'editor'));

ALTER TABLE public.admin_users ALTER COLUMN role SET DEFAULT 'representante';
