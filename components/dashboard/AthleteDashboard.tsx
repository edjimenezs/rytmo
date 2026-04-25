import DashboardNav from './DashboardNav';
import ActionCanvas from './ActionCanvas';
import type { Session } from 'next-auth';

interface AthleteDashboardProps {
  user: Session['user'];
}

export default function AthleteDashboard({ user }: AthleteDashboardProps) {
  return (
    <>
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <ActionCanvas userId={user.id} />
      </div>
    </>
  );
}
