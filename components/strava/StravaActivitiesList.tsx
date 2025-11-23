'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import format from 'date-fns/format';

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number | null;
  duration: number | null;
  startDate: string;
  elevation: number | null;
  averageHeartRate: number | null;
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

export default function StravaActivitiesList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities?source=STRAVA&limit=10');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Strava Activities</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Strava Activities</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No Strava activities found. Click Sync Now to import your activities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Strava Activities</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="border-l-4 border-orange-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{activity.name}</h4>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.startDate), 'MMM d, yyyy')} • {formatDistanceToNow(new Date(activity.startDate), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  {activity.distance && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>{formatDistance(activity.distance)}</span>
                    </div>
                  )}
                  {activity.duration && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDuration(activity.duration)}</span>
                    </div>
                  )}
                  {activity.elevation && activity.elevation > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>{Math.round(activity.elevation)}m</span>
                    </div>
                  )}
                  {activity.averageHeartRate && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{Math.round(activity.averageHeartRate)} bpm</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
