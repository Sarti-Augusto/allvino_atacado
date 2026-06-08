'use server';

import { createServerSupabase } from '@/lib/supabase';
import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

// Configuração de conexão do PostgreSQL (direta para operações em lote eficientes)
const dbConfig = {
  user: 'postgres',
  host: 'db.jlucrpzpacmlnmqfdana.supabase.co',
  database: 'postgres',
  password: 'Allvino#b2b',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

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

    const client = new Client(dbConfig);
    await client.connect();

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

      // 1. Buscar o ID do vinho pelo SKU
      const wineQuery = 'SELECT id FROM public.wines WHERE sku = $1 LIMIT 1;';
      const wineRes = await client.query(wineQuery, [sku]);

      if (wineRes.rows.length === 0) {
        skippedCount++;
        skippedSkus.push(sku);
        continue;
      }

      const wineId = wineRes.rows[0].id;

      // 2. Inserir ou atualizar na tabela wine_regional_prices
      const priceQuery = `
        INSERT INTO public.wine_regional_prices (wine_id, uf, preco)
        VALUES ($1, $2, $3)
        ON CONFLICT (wine_id, uf) DO UPDATE 
        SET preco = EXCLUDED.preco, atualizado_em = now();
      `;
      await client.query(priceQuery, [wineId, uf.toUpperCase(), price]);
      importedCount++;
    }

    await client.end();
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
    const client = new Client(dbConfig);
    await client.connect();

    const query = `
      SELECT 
        rp.id,
        rp.wine_id,
        w.sku,
        w.nome,
        w.produtor,
        w.preco_atacado AS preco_nacional,
        rp.preco AS preco_regional,
        rp.uf,
        rp.atualizado_em
      FROM public.wine_regional_prices rp
      JOIN public.wines w ON w.id = rp.wine_id
      WHERE rp.uf = $1
      ORDER BY w.nome ASC;
    `;

    const { rows } = await client.query(query, [uf.toUpperCase()]);
    await client.end();

    return { prices: rows as RegionalPriceRow[] };
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

    const client = new Client(dbConfig);
    await client.connect();

    const query = 'DELETE FROM public.wine_regional_prices WHERE id = $1 RETURNING id;';
    const { rowCount } = await client.query(query, [id]);
    await client.end();

    if (rowCount === 0) {
      return { error: 'Preço regional não encontrado.' };
    }

    revalidatePath('/admin/precos');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao excluir preço regional.' };
  }
}
