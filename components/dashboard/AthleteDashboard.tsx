import DashboardNav from "./DashboardNav";
import Link from "next/link";
import StravaConnectionStatus from "@/components/strava/StravaConnectionStatus";
import StravaActivitiesList from "@/components/strava/StravaActivitiesList";
import MedicalDocumentsCount from "./MedicalDocumentsCount";
import PhysicalAnalysisPanel from "./PhysicalAnalysisPanel";
import NutritionPanel from "./NutritionPanel";
import TrainingPlanPanel from "./TrainingPlanPanel";

interface AthleteDashboardProps {
  user: any;
}

export default function AthleteDashboard({ user }: AthleteDashboardProps) {
  return (
    <>
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Welcome back, {user.name}!
          </h1>

          {/* Strava Integration Status */}
          <div className="mb-8">
            <StravaConnectionStatus />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">🏃</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Activities
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/activities"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  View all activities
                </Link>
              </div>
            </div>

            {/* Medical Documents */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">🏥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Medical Documents
                      </dt>
                      <dd>
                        <MedicalDocumentsCount />
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/medical"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  Manage medical data
                </Link>
              </div>
            </div>

            {/* Team */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">🤝</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Team Members
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/team"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  Manage team
                </Link>
              </div>
            </div>
          </div>

          {/* Physical Analysis */}
          <div className="mt-8">
            <PhysicalAnalysisPanel />
          </div>

          {/* Training Plan + Nutrition */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrainingPlanPanel />
            <NutritionPanel />
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/analytics"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Analytics
              </Link>
              <Link
                href="/dashboard/activities/manual"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Log Training
              </Link>
              <Link
                href="/dashboard/medical/upload"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Upload Medical Doc
              </Link>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Recent Strava Activities */}
          <div className="mt-8">
            <StravaActivitiesList />
          </div>
        </div>
      </div>
    </>
  );
}
