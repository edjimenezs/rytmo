"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import format from 'date-fns/format';
import DashboardNav from './DashboardNav';
import Link from 'next/link';
import type { Session } from 'next-auth';

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number | null;
  duration: number | null;
  startDate: string;
  elevation: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  averagePace: number | null;
  calories: number | null;
  source: string;
}

function formatDistance(meters: number | null): string {
  if (!meters) return 'N/A';
  const km = meters / 1000;
  return km.toFixed(2) + ' km';
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return hours + 'h ' + minutes + 'm';
  }
  return minutes + 'm';
}

function formatPace(pace: number | null): string {
  if (!pace) return 'N/A';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    RUNNING: '🏃',
    CYCLING: '🚴',
    SWIMMING: '🏊',
    WALKING: '🚶',
    WEIGHTLIFTING: '🏋️',
    YOGA: '🧘',
    OTHER: '🏃',
  };
  return icons[type] || '🏃';
}

function getSourceBadge(source: string): { label: string; color: string } {
  if (source === 'STRAVA') {
    return { label: 'Strava', color: 'bg-orange-100 text-orange-800' };
  }
  return { label: 'Manual', color: 'bg-blue-100 text-blue-800' };
}

export default function ActivitiesPage({ user }: { user: Session["user"] }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'STRAVA' | 'MANUAL'>('ALL');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== 'ALL') {
          params.append('source', filter);
        }
        params.append('limit', '50');

        const response = await fetch(`/api/activities?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage all your training activities
              </p>
            </div>
            <Link
              href="/dashboard/activities/manual"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Log Activity
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({total})
              </button>
              <button
                onClick={() => setFilter('STRAVA')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'STRAVA'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Strava
              </button>
              <button
                onClick={() => setFilter('MANUAL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'MANUAL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {/* Activities List */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🏃</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activities found
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'ALL'
                  ? "You haven't logged any activities yet."
                  : `No ${filter.toLowerCase()} activities found.`}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/dashboard/activities/manual"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Log Your First Activity
                </Link>
                {filter !== 'STRAVA' && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Connect Strava
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => {
                  const sourceBadge = getSourceBadge(activity.source);
                  return (
                    <div
                      key={activity.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        activity.source === 'STRAVA'
                          ? 'border-l-4 border-orange-500'
                          : 'border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">
                              {getActivityIcon(activity.type)}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {activity.name}
                                </h3>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sourceBadge.color}`}
                                >
                                  {sourceBadge.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {format(new Date(activity.startDate), 'EEEE, MMMM d, yyyy')} •{' '}
                                {formatDistanceToNow(new Date(activity.startDate), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {activity.distance && (
                              <div>
                                <p className="text-xs text-gray-500">Distance</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDistance(activity.distance)}
                                </p>
                              </div>
                            )}
                            {activity.duration && (
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDuration(activity.duration)}
                                </p>
                              </div>
                            )}
                            {activity.averagePace && (
                              <div>
                                <p className="text-xs text-gray-500">Avg Pace</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatPace(activity.averagePace)}
                                </p>
                              </div>
                            )}
                            {activity.averageHeartRate && (
                              <div>
                                <p className="text-xs text-gray-500">Avg HR</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {Math.round(activity.averageHeartRate)} bpm
                                </p>
                              </div>
                            )}
                            {activity.elevation && activity.elevation > 0 && (
                              <div>
                                <p className="text-xs text-gray-500">Elevation</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {Math.round(activity.elevation)} m
                                </p>
                              </div>
                            )}
                            {activity.calories && (
                              <div>
                                <p className="text-xs text-gray-500">Calories</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.calories} kcal
                                </p>
                              </div>
                            )}
                            {activity.maxHeartRate && (
                              <div>
                                <p className="text-xs text-gray-500">Max HR</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {Math.round(activity.maxHeartRate)} bpm
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

