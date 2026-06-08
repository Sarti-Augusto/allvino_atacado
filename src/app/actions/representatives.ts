'use server';

import { createServerSupabase } from '@/lib/supabase';
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

// Configuração de conexão do PostgreSQL
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

    const client = new Client(dbConfig);
    await client.connect();

    const query = `
      SELECT 
        au.id, 
        au.nome, 
        au.email, 
        au.role, 
        au.ativo, 
        au.criado_em,
        au.ufs,
        COUNT(ch.id)::int AS budgets_count
      FROM public.admin_users au
      LEFT JOIN public.catalog_history ch ON ch.representative_id = au.id
      GROUP BY au.id, au.ufs
      ORDER BY au.criado_em DESC;
    `;

    const { rows } = await client.query(query);
    await client.end();

    return { representatives: rows as Representative[] };
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

    const client = new Client(dbConfig);
    await client.connect();

    const query = `
      UPDATE public.admin_users 
      SET ativo = $1 
      WHERE id = $2 
      RETURNING id;
    `;

    const { rowCount } = await client.query(query, [active, id]);
    await client.end();

    if (rowCount === 0) {
      return { error: 'Representante não encontrado.' };
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
    const client = new Client(dbConfig);
    await client.connect();

    // 1. Confirmar o e-mail na tabela auth.users
    await client.query(`
      UPDATE auth.users 
      SET email_confirmed_at = now(), confirmed_at = now() 
      WHERE id = $1;
    `, [userId]);

    // 2. Garantir que o perfil foi inserido no public.admin_users
    // (A trigger handle_new_admin_user deve ter feito isso automaticamente, mas vamos garantir)
    await client.query(`
      INSERT INTO public.admin_users (id, email, nome, role, ativo, ufs)
      VALUES ($1, $2, $3, $4, true, $5)
      ON CONFLICT (id) DO UPDATE 
      SET role = EXCLUDED.role, nome = EXCLUDED.nome, ufs = EXCLUDED.ufs;
    `, [userId, email, nome, role, ufs]);

    await client.end();

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

    const client = new Client(dbConfig);
    await client.connect();

    // Deletar da tabela auth.users. A FK em public.admin_users tem delete cascade,
    // então a exclusão será propagada automaticamente.
    const query = `
      DELETE FROM auth.users 
      WHERE id = $1;
    `;

    const { rowCount } = await client.query(query, [id]);
    await client.end();

    if (rowCount === 0) {
      return { error: 'Usuário não encontrado na base de autenticação.' };
    }

    return { success: true };
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

    const client = new Client(dbConfig);
    await client.connect();

    // Compara o telefone ignorando parênteses, traços e espaços
    const query = `
      SELECT nome 
      FROM public.admin_users 
      WHERE REGEXP_REPLACE(whatsapp, '\\D', '', 'g') = $1
         OR REGEXP_REPLACE(whatsapp, '\\D', '', 'g') LIKE $2
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [cleanPhone, `%${cleanPhone}`]);
    await client.end();

    if (rows.length > 0) {
      return { nome: rows[0].nome };
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

    const client = new Client(dbConfig);
    await client.connect();

    const query = `
      UPDATE public.admin_users 
      SET ufs = $1 
      WHERE id = $2 
      RETURNING id;
    `;

    const { rowCount } = await client.query(query, [ufs, id]);
    await client.end();

    if (rowCount === 0) {
      return { error: 'Representante não encontrado.' };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao atualizar UFs do representante.' };
  }
}
