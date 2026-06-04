import WineForm from '@/components/admin/WineForm';
import { createServerSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Wine } from '@/types/wine';

interface EditWinePageProps {
  params: {
    id: string;
  };
}

export default async function EditWinePage({ params }: EditWinePageProps) {
  const supabase = createServerSupabase();

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
