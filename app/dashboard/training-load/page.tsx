import { redirect } from "next/navigation";
import TrainingLoadPage from "@/components/training-load/TrainingLoadPage";
import { getCurrentUser } from "@/lib/auth/utils";

export default async function TrainingLoad() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return <TrainingLoadPage user={user} />;
}
