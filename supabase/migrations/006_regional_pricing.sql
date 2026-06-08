-- =====================================================================
-- Wine Catalog B2B - Precificação Regional por Estado (UF)
-- =====================================================================

-- 1. Adicionar coluna SKU na tabela wines (temporariamente nullable para permitir a inserção)
ALTER TABLE public.wines ADD COLUMN IF NOT EXISTS sku text;

-- 2. Popular SKUs dos vinhos existentes baseado em sua ordem
-- (Isso garante que teremos SKUs válidos e únicos para os registros atuais)
UPDATE public.wines 
SET sku = 'SKU-' || lpad(coalesce(ordem, 0)::text, 4, '0') 
WHERE sku IS NULL;

-- 3. Definir a coluna SKU como NOT NULL e UNIQUE
ALTER TABLE public.wines ALTER COLUMN sku SET NOT NULL;
ALTER TABLE public.wines ADD CONSTRAINT unique_wine_sku UNIQUE (sku);

-- 4. Adicionar coluna ufs (array de estados) na tabela admin_users para representantes
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS ufs text[] DEFAULT '{}';

-- 5. Criar tabela de preços regionais por UF
CREATE TABLE IF NOT EXISTS public.wine_regional_prices (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id       uuid NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  uf            varchar(2) NOT NULL,
  preco         numeric(10,2) NOT NULL CHECK (preco >= 0),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_wine_uf UNIQUE (wine_id, uf)
);

-- Criar índices para otimizar buscas por UF e Wine_ID
CREATE INDEX IF NOT EXISTS idx_wine_regional_prices_uf ON public.wine_regional_prices(uf);
CREATE INDEX IF NOT EXISTS idx_wine_regional_prices_wine ON public.wine_regional_prices(wine_id);

-- Habilitar RLS (Row Level Security) na nova tabela
ALTER TABLE public.wine_regional_prices ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Leitura pública para todos os usuários (anon e autenticados)
DROP POLICY IF EXISTS "regional_prices_public_read" ON public.wine_regional_prices;
CREATE POLICY "regional_prices_public_read"
  ON public.wine_regional_prices FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escrita (INSERT, UPDATE, DELETE) restrita a administradores e donos ativos
DROP POLICY IF EXISTS "regional_prices_admin_write" ON public.wine_regional_prices;
CREATE POLICY "regional_prices_admin_write"
  ON public.wine_regional_prices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid() AND au.ativo = true
    )
  );

-- Trigger para atualizar data de atualização
DROP TRIGGER IF EXISTS trg_wine_regional_prices_updated_at ON public.wine_regional_prices;
CREATE TRIGGER trg_wine_regional_prices_updated_at
  BEFORE UPDATE ON public.wine_regional_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
