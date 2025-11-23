import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { UserRole } from "@prisma/client";
import AthleteDashboard from "@/components/dashboard/AthleteDashboard";
import CoachDashboard from "@/components/dashboard/CoachDashboard";
import NutritionistDashboard from "@/components/dashboard/NutritionistDashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = (user as any).role as UserRole;

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === UserRole.ATHLETE && <AthleteDashboard user={user} />}
      {userRole === UserRole.COACH && <CoachDashboard user={user} />}
      {userRole === UserRole.NUTRITIONIST && <NutritionistDashboard user={user} />}
    </div>
  );
}
