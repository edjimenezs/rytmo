import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  const userRole = (user as any).role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }

  return user;
}
