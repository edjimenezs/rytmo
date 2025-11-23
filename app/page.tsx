import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
            <span className="block">Welcome to</span>
            <span className="block text-blue-600">Streho</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your unified health and sports ecosystem. Connect your training data with medical insights for optimal performance.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 pb-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-600 text-3xl mb-4">🏃</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                For Athletes
              </h3>
              <p className="text-gray-600">
                Track your training, manage medical records, and collaborate with your coaching team - all in one place.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-600 text-3xl mb-4">💪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                For Coaches
              </h3>
              <p className="text-gray-600">
                Access your athletes' complete performance data, including medical insights, to create better training plans.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-600 text-3xl mb-4">🥗</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                For Nutritionists
              </h3>
              <p className="text-gray-600">
                View client activity and health data to provide personalized nutrition guidance for peak performance.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-xl">
                    📊
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Training Integration</h4>
                  <p className="mt-2 text-gray-600">
                    Connect with Strava and other platforms, or enter data manually.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-xl">
                    🏥
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Medical Data</h4>
                  <p className="mt-2 text-gray-600">
                    Store and share lab results, imaging, and health records securely.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-xl">
                    🤝
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Team Collaboration</h4>
                  <p className="mt-2 text-gray-600">
                    Connect with coaches and nutritionists for comprehensive support.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-xl">
                    📈
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Holistic Insights</h4>
                  <p className="mt-2 text-gray-600">
                    Cross-reference training metrics with medical data for better decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
