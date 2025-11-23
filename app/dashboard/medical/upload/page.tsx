import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { UserRole } from "@prisma/client";
import UploadMedicalDocument from "@/components/dashboard/UploadMedicalDocument";

export default async function UploadMedicalRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = (user as any).role as UserRole;

  if (userRole !== UserRole.ATHLETE) {
    redirect("/dashboard");
  }

  return <UploadMedicalDocument user={user} />;
}

