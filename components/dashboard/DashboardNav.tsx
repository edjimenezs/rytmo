"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavProps {
  userName: string | null | undefined;
  userRole: string;
}

export default function DashboardNav({ userName, userRole }: DashboardNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(path);
  };

  const linkClass = (path: string) => {
    const active = isActive(path);
    return active
      ? "border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                Streho
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>
              {userRole === "ATHLETE" && (
                <>
                  <Link href="/dashboard/activities" className={linkClass("/dashboard/activities")}>
                    Activities
                  </Link>
                  <Link href="/dashboard/training-plan" className={linkClass("/dashboard/training-plan")}>
                    Training Plan
                  </Link>
                  <Link href="/dashboard/nutrition-plan" className={linkClass("/dashboard/nutrition-plan")}>
                    Nutrition Plan
                  </Link>
                  <Link href="/dashboard/medical" className={linkClass("/dashboard/medical")}>
                    Medical Data
                  </Link>
                  <Link href="/dashboard/team" className={linkClass("/dashboard/team")}>
                    My Team
                  </Link>
                </>
              )}
              {(userRole === "COACH" || userRole === "NUTRITIONIST") && (
                <Link href="/dashboard/clients" className={linkClass("/dashboard/clients")}>
                  {userRole === "COACH" ? "Athletes" : "Clients"}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-sm text-gray-700 mr-4">
                {userName || "User"}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
