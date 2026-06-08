'use server';

import { createServerSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export interface SelectedWineInput {
  id: string;
  nome: string;
  preco_atacado: number;
  tipo: string;
}

export interface ShareCatalogHistoryInput {
  clienteNome: string;
  clienteWhatsapp: string;
  pdfUrl: string;
  condicoesComerciais: {
    frete: string;
    prazo: string;
    pedidoMinimo: string;
  };
  vinhosSelecionados: SelectedWineInput[];
  representativeNome?: string;
}

/**
 * Realiza o upload do PDF gerado (Base64) para o bucket publico 'pdf-catalogs'
 */
export async function uploadCatalogPdfAction(pdfBase64: string, fileName: string) {
  const supabase = createServerSupabase();

  try {
    // Tratar a string base64
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload para o bucket
    const { data, error } = await supabase.storage
      .from('pdf-catalogs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading catalog PDF to Supabase Storage:', error);
      return { success: false, error: error.message, url: null };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('pdf-catalogs')
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return { success: false, error: 'Falha ao recuperar a URL pública do catálogo', url: null };
    }

    return { success: true, error: null, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('Failed in uploadCatalogPdfAction:', err);
    return { success: false, error: err.message || 'Unknown error', url: null };
  }
}

/**
 * Registra o histórico do catálogo compartilhado e insere as métricas de visualização/download
 */
export async function shareCatalogHistoryAction(input: ShareCatalogHistoryInput) {
  const supabase = createServerSupabase();

  try {
    // Verificar se há uma sessão de representante ativa
    const { data: { user } } = await supabase.auth.getUser();
    let repId: string | null = null;
    let repNome = input.representativeNome || 'Geral';

    if (user) {
      // Buscar perfil do representante
      const { data: profile } = await supabase
        .from('admin_users')
        .select('nome, ativo')
        .eq('id', user.id)
        .single();

      if (profile && profile.ativo) {
        repId = user.id;
        repNome = profile.nome;
      }
    }

    // Inserir histórico com a coluna pdf_url
    const { error: historyError } = await supabase
      .from('catalog_history')
      .insert({
        representative_id: repId,
        representative_nome: repNome,
        cliente_nome: input.clienteNome,
        cliente_whatsapp: input.clienteWhatsapp,
        condicoes_comerciais: input.condicoesComerciais,
        vinhos_selecionados: input.vinhosSelecionados,
        pdf_url: input.pdfUrl,
      });

    if (historyError) {
      console.error('Error inserting catalog history with PDF URL:', historyError);
      return { success: false, error: historyError.message };
    }

    // Registrar o evento de 'download' no analytics de forma paralela para os vinhos selecionados
    if (input.vinhosSelecionados.length > 0) {
      const analyticsRows = input.vinhosSelecionados.map(wine => ({
        wine_id: wine.id,
        tipo_evento: 'download',
      }));

      const { error: analyticsError } = await supabase
        .from('wine_analytics')
        .insert(analyticsRows);

      if (analyticsError) {
        console.error('Error inserting wine analytics downloads:', analyticsError);
        // Não falhamos a requisição principal se apenas o analytics falhar, mas deixamos registrado
      }
    }

    revalidatePath('/admin');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Failed in shareCatalogHistoryAction:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Auxiliar para verificar se o usuário é administrador
 */
async function checkAdminAccess(supabase: any) {
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
    throw new Error('Acesso negado. Apenas administradores podem alterar configurações.');
  }

  return user;
}

/**
 * Busca as configurações de exibição do catálogo (tema de capa e cor)
 */
export async function fetchCatalogSettingsAction() {
  const supabase = createServerSupabase();
  try {
    const { data, error } = await supabase
      .from('catalog_settings')
      .select(`
        cover_theme, 
        primary_color, 
        custom_cover_url, 
        custom_middle_url, 
        custom_back_cover_url,
        cover_show_rep,
        cover_rep_y,
        cover_text_color,
        cover_show_date,
        cover_date_y,
        middle_show_header,
        middle_header_color,
        middle_show_footer,
        middle_footer_color,
        middle_bg_cards,
        back_cover_show_info,
        back_cover_info_y,
        back_cover_info_color,
        show_box_price,
        box_price_label,
        show_unit_price,
        unit_price_label,
        box_units,
        show_country,
        show_region,
        show_grape,
        show_vintage,
        show_type,
        show_description,
        middle_product_name_color,
        middle_price_color,
        middle_tech_info_color
      `)
      .eq('id', 'default')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching catalog settings:', err);
    return { data: null, error: err.message || 'Erro ao buscar configurações.' };
  }
}

/**
 * Atualiza as configurações de exibição do catálogo (tema de capa e cor)
 */
export async function updateCatalogSettingsAction(payload: { 
  coverTheme: string; 
  primaryColor: string;
  customCoverUrl?: string | null;
  customMiddleUrl?: string | null;
  customBackCoverUrl?: string | null;
  coverShowRep?: boolean;
  coverRepY?: number;
  coverTextColor?: string;
  coverShowDate?: boolean;
  coverDateY?: number;
  middleShowHeader?: boolean;
  middleHeaderColor?: string;
  middleShowFooter?: boolean;
  middleFooterColor?: string;
  middleBgCards?: boolean;
  backCoverShowInfo?: boolean;
  backCoverInfoY?: number;
  backCoverInfoColor?: string;
  showBoxPrice?: boolean;
  boxPriceLabel?: string;
  showUnitPrice?: boolean;
  unitPriceLabel?: string;
  boxUnits?: number;
  showCountry?: boolean;
  showRegion?: boolean;
  showGrape?: boolean;
  showVintage?: boolean;
  showType?: boolean;
  showDescription?: boolean;
  middleProductNameColor?: string;
  middlePriceColor?: string;
  middleTechInfoColor?: string;
}) {
  const supabase = createServerSupabase();
  try {
    await checkAdminAccess(supabase);

    const { error } = await supabase
      .from('catalog_settings')
      .update({
        cover_theme: payload.coverTheme,
        primary_color: payload.primaryColor,
        custom_cover_url: payload.customCoverUrl,
        custom_middle_url: payload.customMiddleUrl,
        custom_back_cover_url: payload.customBackCoverUrl,
        cover_show_rep: payload.coverShowRep,
        cover_rep_y: payload.coverRepY,
        cover_text_color: payload.coverTextColor,
        cover_show_date: payload.coverShowDate,
        cover_date_y: payload.coverDateY,
        middle_show_header: payload.middleShowHeader,
        middle_header_color: payload.middleHeaderColor,
        middle_show_footer: payload.middleShowFooter,
        middle_footer_color: payload.middleFooterColor,
        middle_bg_cards: payload.middleBgCards,
        back_cover_show_info: payload.backCoverShowInfo,
        back_cover_info_y: payload.backCoverInfoY,
        back_cover_info_color: payload.backCoverInfoColor,
        show_box_price: payload.showBoxPrice,
        box_price_label: payload.boxPriceLabel,
        show_unit_price: payload.showUnitPrice,
        unit_price_label: payload.unitPriceLabel,
        box_units: payload.boxUnits,
        show_country: payload.showCountry,
        show_region: payload.showRegion,
        show_grape: payload.showGrape,
        show_vintage: payload.showVintage,
        show_type: payload.showType,
        show_description: payload.showDescription,
        middle_product_name_color: payload.middleProductNameColor,
        middle_price_color: payload.middlePriceColor,
        middle_tech_info_color: payload.middleTechInfoColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error updating catalog settings:', err);
    return { success: false, error: err.message || 'Erro ao atualizar configurações.' };
  }
}

/**
 * Realiza o upload de imagens de templates para o storage público
 */
export async function uploadCatalogTemplateAction(formData: FormData) {
  const file = formData.get('file') as File | null;
  if (!file) return { error: 'Nenhum arquivo enviado.' };

  const supabase = createServerSupabase();
  try {
    await checkAdminAccess(supabase);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `templates/${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('wine-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return { error: `Erro no upload do template: ${error.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('wine-images')
      .getPublicUrl(fileName);

    return { publicUrl };
  } catch (err: any) {
    console.error('Error in uploadCatalogTemplateAction:', err);
    return { error: err.message || 'Erro inesperado no upload do template.' };
  }
}
