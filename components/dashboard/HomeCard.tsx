'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ActivityType =
  | 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'WALKING' | 'WEIGHTLIFTING'
  | 'YOGA' | 'OTHER';

interface DayActivity {
  id: string;
  name: string;
  type: ActivityType;
  source: string;
  duration: number | null;
  distance: number | null;
  averageHeartRate: number | null;
  startDate: string;
}

interface DayPlan {
  id: string;
  date: string;
  aiHeadline: string | null;
  summary: string;
  dayType: string | null;
}

interface HistoryDay {
  date: string;
  activities: DayActivity[];
  plan: DayPlan | null;
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

function fmtDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtDistance(meters: number | null): string {
  if (!meters) return '';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export default function HomeCard() {
  const [todayState, setTodayState] = useState<'loading' | 'has_data' | 'no_data'>('loading');
  const [headline, setHeadline] = useState<string | null>(null);
  const [hasCheckin, setHasCheckin] = useState(false);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadToday() {
      try {
        const [checkinRes, activityRes] = await Promise.all([
          fetch('/api/checkin'),
          fetch('/api/checkin/from-activity'),
        ]);
        if (!active) return;

        const checkinData = await checkinRes.json().catch(() => ({}));
        const activityData = await activityRes.json().catch(() => ({}));

        const checkin = !!checkinData?.checkin;
        const hasActivity = !!activityData?.activity;
        setHasCheckin(checkin);
        setTodayState(checkin || hasActivity ? 'has_data' : 'no_data');

        // Always try to load the plan headline
        try {
          const planRes = await fetch('/api/daily-plan');
          if (!active) return;
          if (planRes.ok) {
            const planData = await planRes.json();
            if (active) setHeadline(planData?.plan?.aiHeadline ?? planData?.plan?.summary ?? null);
          }
        } catch { /* non-critical */ }
      } catch {
        if (active) setTodayState('no_data');
      }
    }

    async function loadHistory() {
      try {
        const res = await fetch('/api/history');
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (active) setHistory(data.days ?? []);
        }
      } catch { /* non-critical */ } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadToday();
    loadHistory();
    return () => { active = false; };
  }, []);

  const pastHistory = history.filter((d) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayDate = new Date(`${d.date}T00:00:00Z`);
    return dayDate.getTime() < today.getTime();
  });

  return (
    <div className="space-y-4">
      {/* Today card */}
      {todayState === 'loading' ? (
        <div className="rounded-2xl bg-gray-100 animate-pulse h-32" />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          {todayState === 'has_data' ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">{headline ?? 'Plan listo'}</h2>
              <Link
                href="/plan"
                className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
              >
                Ver tu plan
              </Link>
              {!hasCheckin && (
                <Link
                  href="/checkin"
                  className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Agregar sueño y fatiga →
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="text-base text-gray-500">Sin actividad registrada hoy</p>
              <Link
                href="/plan"
                className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
              >
                Ver plan del día
              </Link>
              <Link
                href="/checkin"
                className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Registrar check-in →
              </Link>
            </>
          )}
        </div>
      )}

      {/* History section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Historial reciente
        </h3>
        {historyLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-16" />
            ))}
          </div>
        ) : pastHistory.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">Sin historial en los últimos 14 días</p>
        ) : (
          <div className="space-y-2">
            {pastHistory.map((day) => (
              <DayHistoryRow key={day.date} day={day} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayHistoryRow({ day }: { day: HistoryDay }) {
  const mainActivity = day.activities[0] ?? null;
  const extraCount = day.activities.length - 1;
  const icon = mainActivity ? (TYPE_ICON[mainActivity.type] ?? '⚡') : '🍽️';
  const headline = day.plan?.aiHeadline ?? day.plan?.summary ?? null;
  const dayLabel = fmtDate(day.date);

  return (
    <Link href={`/plan?date=${day.date}`} className="block">
      <div className="rounded-xl bg-white shadow-sm px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
        <span className="text-2xl mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-800">{dayLabel}</span>
            {mainActivity && (
              <span className="text-xs text-gray-400 shrink-0">
                {[fmtDuration(mainActivity.duration), fmtDistance(mainActivity.distance)]
                  .filter(Boolean)
                  .join(' · ')}
                {extraCount > 0 && ` +${extraCount}`}
              </span>
            )}
          </div>
          {mainActivity && (
            <p className="text-xs text-gray-500 truncate">
              {mainActivity.name}
              {mainActivity.source !== 'MANUAL' && (
                <span className="ml-1 text-gray-400">({mainActivity.source.toLowerCase()})</span>
              )}
            </p>
          )}
          {headline && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{headline}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
