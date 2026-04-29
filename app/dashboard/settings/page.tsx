import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import SettingsPage from '@/components/settings/SettingsPage';

export default async function SettingsRoute() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const strava = await prisma.stravaIntegration.findUnique({ where: { userId: user.id } });

  return (
    <SettingsPage
      userId={user.id}
      userName={user.name ?? ''}
      userEmail={user.email ?? ''}
      hasStrava={!!strava}
    />
  );
}
