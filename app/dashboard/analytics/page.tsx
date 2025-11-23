"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DateRangeSelector, { DateRangeOption } from "@/components/charts/DateRangeSelector";
import TrainingVolumeChart from "@/components/charts/TrainingVolumeChart";
import ActivityBreakdownChart from "@/components/charts/ActivityBreakdownChart";
import PerformanceTrendsChart from "@/components/charts/PerformanceTrendsChart";
import HeartRateZonesChart from "@/components/charts/HeartRateZonesChart";
import CalendarHeatmap from "@/components/charts/CalendarHeatmap";
import StatCard from "@/components/charts/StatCard";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [dateRange, setDateRange] = useState<DateRangeOption>("30d");
  const [volumeMetric, setVolumeMetric] = useState<"duration" | "distance">("duration");
  const [performanceMetric, setPerformanceMetric] = useState<"pace" | "speed" | "distance">("pace");

  const [trainingVolumeData, setTrainingVolumeData] = useState([]);
  const [activityBreakdownData, setActivityBreakdownData] = useState([]);
  const [performanceTrendsData, setPerformanceTrendsData] = useState([]);
  const [heartRateZonesData, setHeartRateZonesData] = useState([]);
  const [calendarHeatmapData, setCalendarHeatmapData] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalyticsData();
    }
  }, [dateRange, status]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [volumeRes, breakdownRes, trendsRes, hrZonesRes, heatmapRes] = await Promise.all([
        fetch(`/api/analytics/training-volume?range=${dateRange}`),
        fetch(`/api/analytics/activity-breakdown?range=${dateRange}`),
        fetch(`/api/analytics/performance-trends?range=${dateRange}`),
        fetch(`/api/analytics/heart-rate-zones?range=${dateRange}`),
        fetch(`/api/analytics/calendar-heatmap`),
      ]);

      const [volumeData, breakdownData, trendsData, hrZonesData, heatmapData] = await Promise.all([
        volumeRes.json(),
        breakdownRes.json(),
        trendsRes.json(),
        hrZonesRes.json(),
        heatmapRes.json(),
      ]);

      setTrainingVolumeData(volumeData);
      setActivityBreakdownData(breakdownData);
      setPerformanceTrendsData(trendsData);
      setHeartRateZonesData(hrZonesData);
      setCalendarHeatmapData(heatmapData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const userRole = (user as any).role || "ATHLETE";

  // Calculate summary stats
  const totalActivities = activityBreakdownData.reduce((sum: number, item: any) => sum + item.count, 0);
  const totalDistance = activityBreakdownData.reduce((sum: number, item: any) => sum + item.value, 0);
  const totalDuration = trainingVolumeData.reduce((sum: number, item: any) => sum + item.duration, 0);
  const avgDuration = totalActivities > 0 ? Math.round(totalDuration / totalActivities) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user?.name || "User"} userRole={userRole} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600 mt-2">Track your progress and analyze your training data</p>
          </div>

          {/* Date Range Selector */}
          <div className="mb-6">
            <DateRangeSelector selected={dateRange} onSelect={setDateRange} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Activities"
              value={totalActivities}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              loading={loading}
            />
            <StatCard
              title="Total Distance"
              value={`${totalDistance.toFixed(1)} km`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              loading={loading}
            />
            <StatCard
              title="Total Duration"
              value={`${totalDuration} min`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              loading={loading}
            />
            <StatCard
              title="Avg Duration"
              value={`${avgDuration} min`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              loading={loading}
            />
          </div>

          {/* Training Consistency */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Consistency</h2>
            <p className="text-sm text-gray-600 mb-4">Your training activity over the last 12 weeks</p>
            <CalendarHeatmap data={calendarHeatmapData} loading={loading} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training Volume */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Training Volume</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVolumeMetric("duration")}
                    className={`px-3 py-1 text-sm rounded-md ${
                      volumeMetric === "duration"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Duration
                  </button>
                  <button
                    onClick={() => setVolumeMetric("distance")}
                    className={`px-3 py-1 text-sm rounded-md ${
                      volumeMetric === "distance"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Distance
                  </button>
                </div>
              </div>
              <TrainingVolumeChart data={trainingVolumeData} metric={volumeMetric} loading={loading} />
            </div>

            {/* Activity Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Breakdown</h2>
              <ActivityBreakdownChart data={activityBreakdownData} loading={loading} />
            </div>

            {/* Performance Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Performance Trends</h2>
                <select
                  value={performanceMetric}
                  onChange={(e) => setPerformanceMetric(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pace">Pace</option>
                  <option value="speed">Speed</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
              <PerformanceTrendsChart data={performanceTrendsData} metric={performanceMetric} loading={loading} />
            </div>

            {/* Heart Rate Zones */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Heart Rate Zones</h2>
              <p className="text-sm text-gray-600 mb-4">Time spent in each heart rate zone</p>
              <HeartRateZonesChart data={heartRateZonesData} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
