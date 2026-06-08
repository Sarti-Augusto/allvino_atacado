'use server';

import { createServerSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Auxiliar para verificar se o usuário atual é administrador e ativo
 */
async function checkAdminAccess() {
  const supabase = createServerSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Não autenticado.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('admin_users')
    .select('ativo, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.ativo) {
    throw new Error('Usuário não autorizado ou inativo.');
  }

  if (profile.role !== 'admin' && profile.role !== 'owner') {
    throw new Error('Acesso negado. Apenas administradores podem gerenciar preços.');
  }

  return { user, profile };
}

export interface RegionalPriceImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  skippedSkus: string[];
  error?: string;
}

/**
 * 1. Importa preços regionais em lote a partir de SKU e Preço para uma determinada UF
 */
export async function importRegionalPricesAction(
  uf: string,
  records: Array<{ sku: string; price: number }>
): Promise<RegionalPriceImportResult> {
  try {
    await checkAdminAccess();

    if (!uf || uf.length !== 2) {
      return { success: false, importedCount: 0, skippedCount: 0, skippedSkus: [], error: 'UF inválida.' };
    }

    if (!records || records.length === 0) {
      return { success: false, importedCount: 0, skippedCount: 0, skippedSkus: [], error: 'Nenhum registro para importar.' };
    }

    const supabase = createServerSupabase();

    let importedCount = 0;
    let skippedCount = 0;
    const skippedSkus: string[] = [];

    // Fazer a importação de cada linha
    for (const record of records) {
      const { sku, price } = record;

      if (!sku || isNaN(price) || price < 0) {
        skippedCount++;
        skippedSkus.push(sku || 'SKU VAZIO');
        continue;
      }

      // 1. Buscar o ID do vinho pelo SKU usando supabase-js
      const { data: wineData, error: wineError } = await supabase
        .from('wines')
        .select('id')
        .eq('sku', sku)
        .maybeSingle();

      if (wineError || !wineData) {
        skippedCount++;
        skippedSkus.push(sku);
        continue;
      }

      const wineId = wineData.id;

      // 2. Inserir ou atualizar na tabela wine_regional_prices usando upsert
      const { error: upsertError } = await supabase
        .from('wine_regional_prices')
        .upsert({
          wine_id: wineId,
          uf: uf.toUpperCase(),
          preco: price,
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'wine_id,uf'
        });

      if (upsertError) {
        console.error(`Erro ao salvar preço regional para SKU ${sku}:`, upsertError);
        skippedCount++;
        skippedSkus.push(sku);
        continue;
      }

      importedCount++;
    }

    revalidatePath('/admin/precos');

    return {
      success: true,
      importedCount,
      skippedCount,
      skippedSkus
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      skippedSkus: [],
      error: err?.message || 'Erro inesperado na importação.'
    };
  }
}

export interface RegionalPriceRow {
  id: string;
  wine_id: string;
  sku: string;
  nome: string;
  produtor: string;
  preco_nacional: number;
  preco_regional: number;
  uf: string;
  atualizado_em: string;
}

/**
 * 2. Busca todos os preços regionais definidos para uma UF
 */
export async function fetchRegionalPricesAction(uf: string): Promise<{ prices?: RegionalPriceRow[]; error?: string }> {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('wine_regional_prices')
      .select(`
        id,
        wine_id,
        preco,
        uf,
        atualizado_em,
        wines (
          sku,
          nome,
          produtor,
          preco_atacado
        )
      `)
      .eq('uf', uf.toUpperCase());

    if (error) {
      return { error: error.message };
    }

    // Mapear para o formato RegionalPriceRow esperado pela UI
    const prices: RegionalPriceRow[] = (data || []).map((row: any) => {
      // PostgREST retorna um objeto para relação belongs-to
      const wine = Array.isArray(row.wines) ? row.wines[0] : row.wines;
      return {
        id: row.id,
        wine_id: row.wine_id,
        sku: wine?.sku || '',
        nome: wine?.nome || '',
        produtor: wine?.produtor || '',
        preco_nacional: wine?.preco_atacado || 0,
        preco_regional: row.preco,
        uf: row.uf,
        atualizado_em: row.atualizado_em
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    return { prices };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao buscar preços regionais.' };
  }
}

/**
 * 3. Exclui um preço regional (voltando o vinho a usar o preço nacional padrão)
 */
export async function deleteRegionalPriceAction(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from('wine_regional_prices')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/precos');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao excluir preço regional.' };
  }
}
