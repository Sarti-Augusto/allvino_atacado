import WineForm from '@/components/admin/WineForm';
import { createServerSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function NewWinePage() {
  const supabase = createServerSupabase();
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

  return <WineForm />;
}
