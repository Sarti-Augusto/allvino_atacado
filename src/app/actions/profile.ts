'use server';

import { createServerSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  role: string;
  ativo: boolean;
  whatsapp: string | null;
  criado_em: string;
}

/**
 * Busca o perfil do usuário atualmente autenticado
 */
export async function fetchCurrentProfileServer(): Promise<{ profile?: UserProfile; error?: string }> {
  try {
    const supabase = createServerSupabase();
    
    // 1. Obter o usuário da sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Usuário não autenticado.' };
    }

    // 2. Buscar dados da tabela public.admin_users
    const { data: profile, error: dbError } = await supabase
      .from('admin_users')
      .select('id, email, nome, role, ativo, whatsapp, criado_em')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      return { error: dbError?.message || 'Perfil do usuário não encontrado.' };
    }

    return { profile: profile as UserProfile };
  } catch (err: any) {
    return { error: err?.message || 'Erro inesperado ao buscar perfil.' };
  }
}

/**
 * Atualiza o perfil e credenciais do usuário atualmente autenticado
 */
export async function updateCurrentProfileServer(payload: {
  nome: string;
  whatsapp: string;
  email: string;
  password?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = createServerSupabase();
    
    // 1. Obter o usuário da sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Usuário não autenticado.' };
    }

    const { nome, whatsapp, email, password } = payload;

    if (!nome || !email) {
      return { error: 'Nome e E-mail são obrigatórios.' };
    }

    // Limpar o número do whatsapp de caracteres não-numéricos
    const cleanWhatsapp = whatsapp ? whatsapp.replace(/\D/g, '') : '';

    // 2. Atualizar tabela pública public.admin_users (Nome e WhatsApp)
    const { error: dbError } = await supabase
      .from('admin_users')
      .update({
        nome,
        whatsapp: cleanWhatsapp || null,
        email // Mantém o e-mail em sincronia
      })
      .eq('id', user.id);

    if (dbError) {
      return { error: `Erro ao atualizar perfil no banco: ${dbError.message}` };
    }

    // 3. Atualizar e-mail no Auth do Supabase se mudou
    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        return { error: `Erro ao atualizar e-mail de acesso: ${emailError.message}` };
      }
    }

    // 4. Atualizar senha no Auth do Supabase se informada
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return { error: 'A nova senha deve ter no mínimo 6 caracteres.' };
      }
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        return { error: `Erro ao atualizar a senha: ${passwordError.message}` };
      }
    }

    // Revalida o caminho para atualizar as informações na tela
    revalidatePath('/admin', 'layout');

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro inesperado ao salvar alterações.' };
  }
}
