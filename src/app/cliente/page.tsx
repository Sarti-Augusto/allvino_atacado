import { redirect } from 'next/navigation';

export default function ClientPage({ searchParams }: { searchParams: { repName?: string; repPhone?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.repName) params.set('repName', searchParams.repName);
  if (searchParams.repPhone) params.set('repPhone', searchParams.repPhone);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  redirect(`/${query}`);
}
