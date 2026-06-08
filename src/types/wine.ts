// =====================================================================
// Tipos compartilhados do domínio "Wine"
// Reflete o schema SQL em /supabase/migrations/001_initial_schema.sql
// =====================================================================

export type WineType =
  | 'Tinto'
  | 'Branco'
  | 'Rose'
  | 'Espumante'
  | 'Fortificado'
  | 'Licoroso';

export const WINE_TYPES: WineType[] = [
  'Tinto',
  'Branco',
  'Rose',
  'Espumante',
  'Fortificado',
  'Licoroso',
];

export interface Wine {
  id: string;
  sku: string;
  nome: string;
  produtor: string;
  pais: string;
  regiao: string | null;
  uva_varietal: string | null;
  tipo: WineType;
  safra: number | null;
  graduacao_alcoolica: number | null;
  preco_atacado: number;       // BRL
  caixa_fechada_qnt: number;
  imagem_url: string | null;
  ficha_tecnica_detalhada: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

// Tipo usado no carrinho de seleção (subset)
export type SelectedWine = Pick<
  Wine,
  | 'id'
  | 'sku'
  | 'nome'
  | 'produtor'
  | 'pais'
  | 'tipo'
  | 'safra'
  | 'preco_atacado'
  | 'imagem_url'
  | 'ficha_tecnica_detalhada'
  | 'uva_varietal'
> & {
  regiao?: string | null;
  caixa_fechada_qnt?: number;
  quantity?: number;
};

export type SortOption = 'destaque' | 'preco_asc' | 'preco_desc' | 'nome_asc' | 'nome_desc';

// Filtros do catálogo
export interface WineFilters {
  search: string;
  tipos: WineType[];
  paises: string[];
  uvas: string[];
  precoMin?: number;
  precoMax?: number;
  sortBy?: SortOption;
}

export const EMPTY_FILTERS: WineFilters = {
  search: '',
  tipos: [],
  paises: [],
  uvas: [],
  sortBy: 'destaque',
};
