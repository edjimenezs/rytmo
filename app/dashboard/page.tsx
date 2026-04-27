import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import HomeCard from '@/components/dashboard/HomeCard';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <p className="text-sm text-gray-500 mb-1">Hola, {user.name ?? 'atleta'}</p>
      <HomeCard />
    </div>
  );
}
