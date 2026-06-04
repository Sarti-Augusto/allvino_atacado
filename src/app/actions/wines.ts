'use server';

// =====================================================================
// Server Actions: listar, criar, editar, excluir e ordenar vinhos (Supabase)
// =====================================================================
import { createServerSupabase } from '@/lib/supabase';
import type { Wine, WineFilters, WineType } from '@/types/wine';
import crypto from 'crypto';

export interface FetchWinesResult {
  wines: Wine[];
  total: number;
  error: string | null;
}

// 1. Listar vinhos ativos (para catálogo público B2C/B2B)
export async function fetchWinesServer(filters: WineFilters = {
  search: '', tipos: [], paises: [], uvas: [],
}): Promise<FetchWinesResult> {
  const supabase = createServerSupabase();

  let q = supabase
    .from('wines')
    .select('*', { count: 'exact' })
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (filters.tipos.length) {
    q = q.in('tipo', filters.tipos as WineType[]);
  }
  if (filters.paises.length) {
    q = q.in('pais', filters.paises);
  }
  if (filters.precoMin !== undefined) q = q.gte('preco_atacado', filters.precoMin);
  if (filters.precoMax !== undefined) q = q.lte('preco_atacado', filters.precoMax);
  if (filters.search.trim()) {
    const s = `%${filters.search.trim()}%`;
    q = q.or(`nome.ilike.${s},produtor.ilike.${s},uva_varietal.ilike.${s},regiao.ilike.${s}`);
  }

  const { data, count, error } = await q;
  return {
    wines: (data ?? []) as Wine[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

// 2. Listar vinhos administrativo (ativos e inativos)
export async function fetchAdminWinesServer(search: string = ''): Promise<FetchWinesResult> {
  const supabase = createServerSupabase();

  let q = supabase
    .from('wines')
    .select('*', { count: 'exact' })
    .order('destaque', { ascending: false })
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`nome.ilike.${s},produtor.ilike.${s},uva_varietal.ilike.${s},regiao.ilike.${s}`);
  }

  const { data, count, error } = await q;
  return {
    wines: (data ?? []) as Wine[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

// 3. Ativar / Desativar Vinho (Toggle)
export async function toggleWineActiveServer(id: string, active: boolean) {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('wines')
    .update({ ativo: active })
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

// 4. Marcar / Desmarcar Destaque (Toggle)
export async function toggleWineFeaturedServer(id: string, featured: boolean) {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('wines')
    .update({ destaque: featured })
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

// 5. Atualizar Ordenação Manual (Ordem)
export async function updateWineOrderServer(id: string, order: number) {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('wines')
    .update({ ordem: order })
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

// 6. Excluir Vinho
export async function deleteWineServer(id: string) {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('wines')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

// 7. Upload de Imagem de Vinho para o Supabase Storage (UUID + Extensão)
export async function uploadWineImageAction(formData: FormData) {
  const file = formData.get('file') as File | null;
  if (!file) return { error: 'Nenhum arquivo de imagem enviado.' };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const supabase = createServerSupabase();

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('wine-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return { error: `Erro no upload: ${error.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('wine-images')
      .getPublicUrl(fileName);

    return { publicUrl };
  } catch (err: any) {
    return { error: `Falha no processamento do arquivo: ${err.message}` };
  }
}

// 8. Inserir Vinho
export async function createWineServer(data: any) {
  const supabase = createServerSupabase();
  const { data: result, error } = await supabase
    .from('wines')
    .insert([data])
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, data: result };
}

// 9. Atualizar Vinho
export async function updateWineServer(id: string, data: any) {
  const supabase = createServerSupabase();
  const { data: result, error } = await supabase
    .from('wines')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, data: result };
}
