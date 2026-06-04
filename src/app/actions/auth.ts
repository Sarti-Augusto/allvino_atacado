'use server';

import { createServerSupabase } from '@/lib/supabase';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  const supabase = createServerSupabase();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Valida se o usuário existe na tabela public.admin_users e está ativo
    const { data: adminProfile, error: profileError } = await supabase
      .from('admin_users')
      .select('ativo')
      .eq('id', data.user.id)
      .single();

    if (profileError || !adminProfile || !adminProfile.ativo) {
      // Se não for admin ou não estiver ativo, força o logout para limpar o cookie de sessão
      await supabase.auth.signOut();
      return { error: 'Usuário não autorizado ou inativo.' };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro inesperado ao realizar login.' };
  }
}

export async function logoutAction() {
  const supabase = createServerSupabase();
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao realizar logout.' };
  }
}
