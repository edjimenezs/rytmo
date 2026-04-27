import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import CheckinForm from '@/components/nutrition/CheckinForm';

export default async function CheckinPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <CheckinForm />
    </div>
  );
}
