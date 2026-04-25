import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { UserRole } from "@prisma/client";
import ActivitiesPage from "@/components/dashboard/ActivitiesPage";

export default async function ActivitiesRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = user.role ?? UserRole.ATHLETE;

  if (userRole !== UserRole.ATHLETE) {
    redirect("/dashboard");
  }

  return <ActivitiesPage user={user} />;
}
