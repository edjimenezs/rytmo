import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import HomeCard from '@/components/dashboard/HomeCard';
import DateHeader from '@/components/dashboard/DateHeader';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const firstName = user.name?.split(' ')[0] ?? 'atleta';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 sm:px-6">
      <DateHeader firstName={firstName} />
      <HomeCard />
    </div>
  );
}
