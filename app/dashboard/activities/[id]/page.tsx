import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import ActivityDetailView from '@/components/dashboard/ActivityDetailView';

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const { id } = await params;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <ActivityDetailView activityId={id} />
    </div>
  );
}
