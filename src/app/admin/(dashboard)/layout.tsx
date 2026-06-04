import { createServerSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export default async function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const supabase = createServerSupabase();

  // 1. Obter usuário logado de forma segura
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/admin/login');
  }

  // 2. Query para checar se o usuário existe em public.admin_users e se está ativo
  const { data: profile, error: profileError } = await supabase
    .from('admin_users')
    .select('ativo, role, nome')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.ativo) {
    // Se o perfil não for encontrado ou estiver inativo, força logout e redireciona
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#0B090A] text-gray-100 flex flex-col">
      {/* Header Premium do Painel Administrativo */}
      <header className="border-b border-[#1A1617] bg-[#1A1617]/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[#A61C3C] font-bold text-xl tracking-wider">ALLVINO</span>
          <span className="text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-700 bg-gray-800">B2B ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-200">{profile.nome}</p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#A61C3C] flex items-center justify-center font-bold text-white text-sm select-none">
            {profile.nome.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
