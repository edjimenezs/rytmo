import DashboardNav from "./DashboardNav";
import Link from "next/link";
import type { Session } from "next-auth";

interface CoachDashboardProps {
  user: Session["user"];
}

export default function CoachDashboard({ user }: CoachDashboardProps) {
  return (
    <>
      <DashboardNav userName={user.name} userRole="COACH" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Coach Dashboard
          </h1>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Athletes */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        My Athletes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/clients"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  View all athletes
                </Link>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">📋</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Requests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/requests"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  View requests
                </Link>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">📝</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Notes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/notes"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  View all notes
                </Link>
              </div>
            </div>
          </div>

          {/* Athletes List */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                My Athletes
              </h2>
              <Link
                href="/dashboard/clients"
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                View all
              </Link>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-500">
                No athletes yet. Share your profile link with athletes to get started!
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard/notes/new"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Create Note
              </Link>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
