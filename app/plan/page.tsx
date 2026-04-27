import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import DailyPlanView from '@/components/nutrition/DailyPlanView';

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const { date } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <DailyPlanView date={date} />
    </div>
  );
}
