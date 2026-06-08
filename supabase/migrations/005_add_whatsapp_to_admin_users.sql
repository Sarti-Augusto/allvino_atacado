-- =====================================================================
-- Wine Catalog B2B - Adicionar coluna whatsapp à tabela admin_users
-- =====================================================================

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS whatsapp text;
