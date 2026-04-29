import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import HomeCard from '@/components/dashboard/HomeCard';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const firstName = user.name?.split(' ')[0] ?? 'atleta';
  const dateLabel = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 sm:px-6">
      <div className="mb-5">
        <p className="text-xs text-gray-400 capitalize">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Hola, {firstName}</h1>
      </div>
      <HomeCard />
    </div>
  );
}
