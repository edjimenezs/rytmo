import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import DailyPlanView from '@/components/nutrition/DailyPlanView';

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6">
      <DailyPlanView />
    </div>
  );
}
