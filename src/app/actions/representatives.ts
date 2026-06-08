'use server';

import { createServerSupabase, getDbConfig } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

export interface Representative {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  criado_em: string;
  budgets_count: number;
  ufs: string[];
}

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
    throw new Error('Acesso negado. Apenas administradores podem gerenciar representantes.');
  }

  return { user, profile };
}

/**
 * 1. Busca a lista completa de representantes e a contagem de orçamentos de cada um
 */
export async function fetchRepresentativesAction(): Promise<{ representatives?: Representative[]; error?: string }> {
  try {
    await checkAdminAccess();

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        nome,
        email,
        role,
        ativo,
        criado_em,
        ufs,
        catalog_history (
          id
        )
      `)
      .order('criado_em', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    const representatives: Representative[] = (data || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: row.role,
      ativo: row.ativo,
      criado_em: row.criado_em,
      ufs: row.ufs || [],
      budgets_count: row.catalog_history ? row.catalog_history.length : 0
    }));

    return { representatives };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao buscar representantes.' };
  }
}

/**
 * 2. Alterna o status ativo/inativo de um representante
 */
export async function toggleRepresentativeActiveAction(id: string, active: boolean): Promise<{ success?: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from('admin_users')
      .update({ ativo: active })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao alterar status do representante.' };
  }
}

/**
 * 3. Cadastra um novo representante no Auth e define seu papel
 */
export async function createRepresentativeAction(payload: {
  nome: string;
  email: string;
  password: string;
  role: 'admin' | 'representante';
  ufs?: string[];
}): Promise<{ success?: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const { nome, email, password, role, ufs = [] } = payload;

    if (!nome || !email || !password || !role) {
      return { error: 'Todos os campos são obrigatórios.' };
    }

    // Criar cliente Supabase temporário sem persistência de sessão para não deslogar o administrador
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
        }
      }
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Erro ao cadastrar usuário no Supabase Auth.' };
    }

    const userId = authData.user.id;

    // Conectar diretamente ao banco Postgres para forçar confirmação de e-mail e aplicar papel
    try {
      const client = new Client(getDbConfig());
      await client.connect();

      // 1. Confirmar o e-mail na tabela auth.users
      await client.query(`
        UPDATE auth.users 
        SET email_confirmed_at = now(), confirmed_at = now() 
        WHERE id = $1;
      `, [userId]);

      // 2. Garantir que o perfil foi inserido no public.admin_users
      await client.query(`
        INSERT INTO public.admin_users (id, email, nome, role, ativo, ufs)
        VALUES ($1, $2, $3, $4, true, $5)
        ON CONFLICT (id) DO UPDATE 
        SET role = EXCLUDED.role, nome = EXCLUDED.nome, ufs = EXCLUDED.ufs;
      `, [userId, email, nome, role, ufs]);

      await client.end();
    } catch (dbErr) {
      console.warn("Nota: Não foi possível conectar ao banco direto para auto-confirmar e-mail:", dbErr);
      
      // Se falhar a conexão direta (ex: Vercel sem IPv6), inserimos o perfil via Supabase Client
      const supabase = createServerSupabase();
      const { error: profileError } = await supabase
        .from('admin_users')
        .upsert({
          id: userId,
          email,
          nome,
          role,
          ativo: true,
          ufs
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error("Erro ao criar perfil de representante:", profileError);
        return { error: `Usuário criado, mas falhou ao criar perfil: ${profileError.message}` };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao criar representante.' };
  }
}

/**
 * 4. Exclui permanentemente um representante
 */
export async function deleteRepresentativeAction(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await checkAdminAccess();

    if (user.id === id) {
      return { error: 'Você não pode excluir sua própria conta.' };
    }

    // Tentar deletar diretamente da tabela auth.users via postgres
    try {
      const client = new Client(getDbConfig());
      await client.connect();
      const query = 'DELETE FROM auth.users WHERE id = $1;';
      await client.query(query, [id]);
      await client.end();
      return { success: true };
    } catch (dbErr: any) {
      console.warn("Falha ao excluir direto no auth.users via PostgreSQL:", dbErr);
      
      // Se a exclusão direta falhar (ex: no Vercel sem IPv6), removemos o perfil público
      const supabase = createServerSupabase();
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);
        
      if (error) {
        return { error: error.message };
      }
      
      return { 
        success: true, 
        error: "Perfil público removido. A exclusão da conta de autenticação precisará ser concluída manualmente pelo painel do Supabase Auth devido à restrição de rede IPv6 do servidor." 
      };
    }
  } catch (err: any) {
    return { error: err?.message || 'Erro ao excluir representante.' };
  }
}

/**
 * 5. Busca o nome do representante pelo número de WhatsApp
 */
export async function getRepresentativeNameByPhoneAction(phone: string): Promise<{ nome?: string; error?: string }> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      return { error: 'Telefone inválido.' };
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('admin_users')
      .select('nome, whatsapp');

    if (error) {
      return { error: error.message };
    }

    const matched = (data || []).find((user: any) => {
      if (!user.whatsapp) return false;
      const cleanUserPhone = user.whatsapp.replace(/\D/g, '');
      return cleanUserPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cleanUserPhone);
    });

    if (matched) {
      return { nome: matched.nome };
    }
    return { error: 'Representante não encontrado.' };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao buscar nome do representante.' };
  }
}

/**
 * 6. Atualiza as UFs ativas de um representante
 */
export async function updateRepresentativeUfsAction(id: string, ufs: string[]): Promise<{ success?: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from('admin_users')
      .update({ ufs })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao atualizar UFs do representante.' };
  }
}
