'use server';

import { createServerSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface WineAnalyticsEvent {
  wineId: string;
  tipoEvento: 'click' | 'download';
}

export interface CatalogHistoryInput {
  clienteNome: string;
  clienteWhatsapp: string;
  condicoesComerciais: {
    frete: string;
    prazo: string;
    pedidoMinimo: string;
  };
  vinhosSelecionados: Array<{
    id: string;
    nome: string;
    preco_atacado: number;
    tipo: string;
  }>;
}

// 1. Registrar evento de Analytics (Click / Download) - Público
export async function recordWineEventAction(wineId: string, tipoEvento: 'click' | 'download') {
  const supabase = createServerSupabase();

  try {
    const { error } = await supabase
      .from('wine_analytics')
      .insert({
        wine_id: wineId,
        tipo_evento: tipoEvento
      });

    if (error) {
      console.error(`Error inserting analytic event (${tipoEvento}) for wine ${wineId}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Failed to log event', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

// 2. Salvar Histórico de Catálogo Gerado - Restrito a Representantes
export async function saveCatalogHistoryAction(input: CatalogHistoryInput) {
  const supabase = createServerSupabase();

  try {
    // Verificar sessão ativa
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Buscar perfil do representante
    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .select('nome, ativo')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.ativo) {
      return { success: false, error: 'Representante inativo ou não encontrado' };
    }

    // Inserir histórico
    const { error } = await supabase
      .from('catalog_history')
      .insert({
        representative_id: user.id,
        representative_nome: profile.nome,
        cliente_nome: input.clienteNome,
        cliente_whatsapp: input.clienteWhatsapp,
        condicoes_comerciais: input.condicoesComerciais,
        vinhos_selecionados: input.vinhosSelecionados
      });

    if (error) {
      console.error('Error inserting catalog history:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Failed to save catalog history', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

// 3. Buscar Dados Consolidados de Analytics e Histórico - Restrito a Admins
export async function fetchAnalyticsDashboardAction() {
  const supabase = createServerSupabase();

  try {
    // Validar autenticação do administrador
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: 'Acesso negado' };
    }

    const { data: profile } = await supabase
      .from('admin_users')
      .select('ativo, role')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.ativo) {
      return { data: null, error: 'Representante inativo' };
    }

    // Carregar todos os eventos de analytics
    const { data: events, error: eventsError } = await supabase
      .from('wine_analytics')
      .select('wine_id, tipo_evento');

    if (eventsError) throw eventsError;

    // Carregar todos os vinhos (ativos e inativos para incluir históricos passados)
    const { data: wines, error: winesError } = await supabase
      .from('wines')
      .select('id, nome, produtor, tipo');

    if (winesError) throw winesError;

    // Carregar histórico de orçamentos (representante vê apenas o próprio histórico)
    let historyQuery = supabase
      .from('catalog_history')
      .select('*');

    if (profile.role !== 'admin') {
      historyQuery = historyQuery.eq('representative_id', user.id);
    }

    const { data: history, error: historyError } = await historyQuery
      .order('criado_em', { ascending: false });

    if (historyError) throw historyError;

    // Agregar métricas por vinho no Javascript
    const metricsMap: Record<string, { clicks: number; downloads: number }> = {};
    events?.forEach(evt => {
      if (!metricsMap[evt.wine_id]) {
        metricsMap[evt.wine_id] = { clicks: 0, downloads: 0 };
      }
      if (evt.tipo_evento === 'click') {
        metricsMap[evt.wine_id].clicks++;
      } else if (evt.tipo_evento === 'download') {
        metricsMap[evt.wine_id].downloads++;
      }
    });

    const ranking = wines.map(w => {
      const metrics = metricsMap[w.id] || { clicks: 0, downloads: 0 };
      return {
        id: w.id,
        nome: w.nome,
        produtor: w.produtor,
        tipo: w.tipo,
        clicks: metrics.clicks,
        downloads: metrics.downloads,
        total: metrics.clicks + metrics.downloads
      };
    }).sort((a, b) => b.total - a.total); // Ordenar por total de interações

    // Totais Gerais
    const totalClicks = events?.filter(e => e.tipo_evento === 'click').length || 0;
    const totalDownloads = events?.filter(e => e.tipo_evento === 'download').length || 0;
    const totalOrçamentos = history?.length || 0;

    return {
      data: {
        ranking: ranking.slice(0, 15), // Top 15 mais populares
        history: history || [],
        totals: {
          clicks: totalClicks,
          downloads: totalDownloads,
          orcamentos: totalOrçamentos
        }
      },
      error: null
    };

  } catch (err: any) {
    console.error('Failed to fetch analytics', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}
