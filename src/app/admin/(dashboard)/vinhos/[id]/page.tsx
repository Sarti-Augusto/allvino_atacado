import WineForm from '@/components/admin/WineForm';
import { createServerSupabase } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';
import type { Wine } from '@/types/wine';

interface EditWinePageProps {
  params: {
    id: string;
  };
}

export default async function EditWinePage({ params }: EditWinePageProps) {
  const supabase = createServerSupabase();
  
  // Verificar sessão e permissão admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('admin_users')
    .select('ativo, role')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.ativo || profile.role !== 'admin') {
    redirect('/admin');
  }

  // Busca o vinho pelo ID fornecido na URL
  const { data: wine, error } = await supabase
    .from('wines')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !wine) {
    notFound();
  }

  return <WineForm initialData={wine as Wine} />;
}
