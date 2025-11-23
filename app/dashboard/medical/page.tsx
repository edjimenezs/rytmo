import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { UserRole } from "@prisma/client";
import MedicalDataPage from "@/components/dashboard/MedicalDataPage";

export default async function MedicalDataRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = (user as any).role as UserRole;

  if (userRole !== UserRole.ATHLETE) {
    redirect("/dashboard");
  }

  return <MedicalDataPage user={user} />;
}

