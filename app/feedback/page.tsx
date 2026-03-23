import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import FeedbackForm from '@/components/nutrition/FeedbackForm';

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6">
      <FeedbackForm />
    </div>
  );
}
