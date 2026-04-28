'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DailyPlanView from '@/components/nutrition/DailyPlanView';

interface Activity {
  id: string;
  name: string;
  type: string;
  source: string;
  distance: number | null;
  duration: number | null;
  elevation: number | null;
  calories: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  averagePace: number | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  notes: string | null;
}

const TYPE_ICON: Record<string, string> = {
  RUNNING: '🏃',
  CYCLING: '🚴',
  SWIMMING: '🏊',
  WALKING: '🚶',
  WEIGHTLIFTING: '🏋️',
  YOGA: '🧘',
  OTHER: '⚡',
};

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  STRAVA: { label: 'Strava', color: 'bg-orange-100 text-orange-800' },
  GARMIN: { label: 'Garmin', color: 'bg-teal-100 text-teal-800' },
  MANUAL: { label: 'Manual', color: 'bg-blue-100 text-blue-800' },
};

function fmtDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function fmtDistance(meters: number | null): string {
  if (!meters) return '';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function fmtPace(pace: number | null): string {
  if (!pace) return '';
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function ActivityDetailView({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/activities/${activityId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setActivity(data.activity))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [activityId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-2/3 rounded-xl bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="rounded-2xl bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-800">No se pudo cargar la actividad.</p>
      </div>
    );
  }

  const icon = TYPE_ICON[activity.type] ?? '⚡';
  const badge = SOURCE_LABEL[activity.source] ?? { label: activity.source, color: 'bg-gray-100 text-gray-700' };
  const activityDate = activity.startDate.slice(0, 10);
  const startTime = new Date(activity.startDate).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateLabel = new Date(`${activityDate}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats: { label: string; value: string }[] = [
    { label: 'Duración', value: fmtDuration(activity.duration) },
    ...(activity.distance ? [{ label: 'Distancia', value: fmtDistance(activity.distance) }] : []),
    ...(activity.averagePace ? [{ label: 'Paso medio', value: fmtPace(activity.averagePace) }] : []),
    ...(activity.averageHeartRate ? [{ label: 'FC media', value: `${Math.round(activity.averageHeartRate)} bpm` }] : []),
    ...(activity.maxHeartRate ? [{ label: 'FC máx', value: `${Math.round(activity.maxHeartRate)} bpm` }] : []),
    ...(activity.elevation && activity.elevation > 0 ? [{ label: 'Desnivel', value: `${Math.round(activity.elevation)} m` }] : []),
    ...(activity.calories ? [{ label: 'Calorías', value: `${activity.calories} kcal` }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/dashboard/activities" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 gap-1">
        ← Actividades
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">{activity.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{dateLabel} · {startTime}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {stats.map(s => (
            <StatCell key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        {activity.description && (
          <p className="text-sm text-gray-500 pt-1">{activity.description}</p>
        )}
      </div>

      {/* Nutrition plan for this day */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Plan nutricional del día
        </h2>
        <DailyPlanView date={activityDate} />
      </div>
    </div>
  );
}
