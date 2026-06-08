import { createServerSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
    <div className="min-h-screen bg-stone-900 text-stone-200 flex flex-col font-sans">
      {/* Header Premium do Painel Administrativo */}
      <header className="border-b border-stone-850 bg-stone-900/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-soft">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-display text-xl font-semibold tracking-display text-stone-50 transition hover:text-gold-400">
            ALLVINO
          </Link>
          {profile.role === 'admin' ? (
            <span className="text-[10px] font-bold text-gold-500 px-2 py-0.5 rounded-full border border-gold-500/20 bg-gold-500/5 tracking-wider uppercase select-none">
              B2B Admin
            </span>
          ) : profile.role === 'owner' ? (
            <span className="text-[10px] font-bold text-gold-500 px-2 py-0.5 rounded-full border border-gold-500/20 bg-gold-500/5 tracking-wider uppercase select-none">
              Owner
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 tracking-wider uppercase select-none">
              Representante
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/admin/perfil" title="Configurações de Perfil" className="flex items-center gap-3 hover:opacity-80 transition active:scale-98">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-stone-100">{profile.nome}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                {profile.role === 'admin' ? 'B2B Admin' : profile.role === 'owner' ? 'Owner' : 'Representante'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-allvino-500 hover:bg-allvino-600 text-white flex items-center justify-center font-bold text-xs uppercase select-none tracking-wider shadow-sm">
              {profile.nome.substring(0, 2).toUpperCase()}
            </div>
          </Link>
        </div>
      </header>
 
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
