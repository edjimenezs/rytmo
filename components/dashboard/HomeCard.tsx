'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface PlanEntry {
  id: string;
  title: string;
  sessionType: string;
  durationMinutes?: number | null;
}

interface ScheduledWorkout {
  id: number;
  title: string;
  date: string;
  durationSeconds?: number;
  activityTypeKey?: string;
}

interface CheckinRecord {
  sleepHours?: number | null;
  sleepQuality?: number | null;
  fatigue?: number | null;
  hunger?: number | null;
  stress?: number | null;
  trainingType?: string | null;
  durationMin?: number | null;
  intensity?: string | null;
  timeOfDay?: string | null;
  notes?: string | null;
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

const TIME_LABELS: Record<string, string> = {
  morning: 'Mañana',
  midday: 'Mediodía',
  evening: 'Tarde',
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
  const [planEntry, setPlanEntry] = useState<PlanEntry | null>(null);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [checkinData, setCheckinData] = useState<CheckinRecord | null>(null);
  const [trainingTime, setTrainingTimeState] = useState<string | null>(null);
  const [settingTime, setSettingTime] = useState(false);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.days ?? []);
      }
    } catch { /* non-critical */ } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const [checkinRes, activityRes] = await Promise.all([
        fetch('/api/checkin'),
        fetch('/api/checkin/from-activity'),
      ]);
      const checkinJson = await checkinRes.json().catch(() => ({}));
      const activityData = await activityRes.json().catch(() => ({}));
      const checkin = !!checkinJson?.checkin;
      const hasActivity = !!activityData?.activity;
      setHasCheckin(checkin);
      setCheckinData(checkinJson?.checkin ?? null);
      setTodayState(checkin || hasActivity ? 'has_data' : 'no_data');

      try {
        const planRes = await fetch('/api/daily-plan');
        if (planRes.ok) {
          const planData = await planRes.json();
          setHeadline(planData?.plan?.aiHeadline ?? planData?.plan?.summary ?? null);
          setPlanEntry(planData?.plan?.planEntry ?? null);
          setTrainingTimeState(planData?.plan?.trainingTime ?? null);
          if (planData?.plan?.hasGarminHealth) setHasCheckin(true);
        }
      } catch { /* non-critical */ }
    } catch {
      setTodayState('no_data');
    }
  }, []);

  useEffect(() => {
    loadToday();
    loadHistory();
    // Non-blocking: fetch Garmin calendar for today's scheduled workout
    fetch('/api/garmin/today-workout')
      .then(r => r.ok ? r.json() : null)
      .then(async (data) => {
        if (!data?.workouts?.length) return;
        setScheduledWorkouts(data.workouts);
        setTodayState('has_data');

        // Map Garmin activity type → checkin trainingType for the nutrition engine
        const w = data.workouts[0];
        const typeMap: Record<string, string> = {
          cycling: 'bike', indoor_cycling: 'bike', virtual_ride: 'bike',
          running: 'run', trail_running: 'run',
          swimming: 'swim', open_water_swimming: 'swim',
          strength_training: 'strength', yoga: 'strength',
        };
        const trainingType = typeMap[w.activityTypeKey ?? ''] ?? 'strength';
        const durationMin = w.durationSeconds ? Math.round(w.durationSeconds / 60) : null;

        // Read latest checkin fresh to avoid stale closure
        const checkinJson = await fetch('/api/checkin').then(r => r.ok ? r.json() : {}).catch(() => ({} as Record<string, unknown>));
        const existing = (checkinJson as Record<string, unknown>)?.checkin as CheckinRecord | null;
        if (!existing?.trainingType) {
          await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...existing, trainingType, durationMin }),
          }).catch(() => {});
          await loadToday();
        }
      })
      .catch(() => {});
  }, [loadToday, loadHistory]);

  async function handleSetTrainingTime(time: 'morning' | 'midday' | 'evening') {
    setSettingTime(true);
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkinData, timeOfDay: time }),
      });
      await loadToday();
    } catch { /* non-critical */ } finally {
      setSettingTime(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const [garminRes, stravaRes] = await Promise.allSettled([
        fetch('/api/garmin/sync', { method: 'POST' }),
        fetch('/api/strava/sync', { method: 'POST' }),
      ]);

      const garminOk = garminRes.status === 'fulfilled' && garminRes.value.ok;
      const stravaOk = stravaRes.status === 'fulfilled' && stravaRes.value.ok;

      let garminCount = 0;
      let stravaCount = 0;
      let garminErr = '';
      let stravaErr = '';

      let garminHealthErr = '';
      if (garminRes.status === 'fulfilled') {
        const d = await garminRes.value.json().catch(() => ({}));
        garminCount = d.synced ?? 0;
        garminErr = d.error ?? '';
        garminHealthErr = d.healthError ?? '';
      }
      if (stravaRes.status === 'fulfilled') {
        const d = await stravaRes.value.json().catch(() => ({}));
        stravaCount = d.synced ?? 0;
        stravaErr = d.error ?? '';
      }

      if (garminOk || stravaOk) {
        const parts = [];
        if (garminOk) {
          parts.push(`Garmin: ${garminCount} actividades`);
          if (garminHealthErr) parts.push(`salud: error (${garminHealthErr})`);
          else parts.push('salud: ok');
        } else {
          parts.push(`Garmin: error${garminErr ? ` (${garminErr})` : ''}`);
        }
        if (stravaOk) parts.push(`Strava: ${stravaCount} actividades`);
        else parts.push(`Strava: error${stravaErr ? ` (${stravaErr})` : ''}`);
        setSyncMsg(parts.join(' · '));
        setHistoryLoading(true);
        setTodayState('loading');
        await Promise.all([loadToday(), loadHistory()]);
      } else {
        const garminMsg = garminRes.status === 'rejected'
          ? 'sin respuesta'
          : (garminErr || 'falló');
        const stravaMsg = stravaRes.status === 'rejected'
          ? 'sin respuesta'
          : (stravaErr || 'falló');
        setSyncMsg(`Garmin: ${garminMsg} · Strava: ${stravaMsg}`);
      }
    } catch (e) {
      setSyncMsg(`Error: ${e instanceof Error ? e.message : 'desconocido'}`);
    } finally {
      setSyncing(false);
    }
  }

  // Only show the badge when the user explicitly selected a time — not from plan defaults
  const explicitTimeOfDay = checkinData?.timeOfDay ?? null;
  const timeOfDay = explicitTimeOfDay;

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

              {/* Garmin calendar: scheduled workouts from TrainingPeaks */}
              {!planEntry && scheduledWorkouts.length > 0 && (
                <div className="space-y-2">
                  {scheduledWorkouts.map((w) => (
                    <p key={w.id} className="text-sm text-gray-500 flex items-center gap-1.5">
                      <span>{TYPE_ICON[w.activityTypeKey?.toUpperCase() ?? ''] ?? '🏋️'}</span>
                      <span>
                        {w.title}
                        {w.durationSeconds ? ` · ${fmtDuration(w.durationSeconds)}` : ''}
                      </span>
                      {timeOfDay && (
                        <span className="ml-1 inline-block bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                          {TIME_LABELS[timeOfDay] ?? timeOfDay}
                        </span>
                      )}
                    </p>
                  ))}
                  {!timeOfDay && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-400">¿A qué hora entrenas?</p>
                      <div className="flex gap-2">
                        {(['morning', 'midday', 'evening'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => handleSetTrainingTime(t)}
                            disabled={settingTime}
                            className="flex-1 text-sm py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors disabled:opacity-50"
                          >
                            {TIME_LABELS[t]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Training plan entry summary */}
              {planEntry && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {planEntry.sessionType} · {planEntry.title}
                    {planEntry.durationMinutes ? ` · ${Math.round(planEntry.durationMinutes)} min` : ''}
                    {timeOfDay && (
                      <span className="ml-2 inline-block bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {TIME_LABELS[timeOfDay] ?? timeOfDay}
                      </span>
                    )}
                  </p>

                  {/* Time selector — only show if timeOfDay not yet set */}
                  {!timeOfDay && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-400">¿A qué hora entrenas?</p>
                      <div className="flex gap-2">
                        {(['morning', 'midday', 'evening'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => handleSetTrainingTime(t)}
                            disabled={settingTime}
                            className="flex-1 text-sm py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors disabled:opacity-50"
                          >
                            {TIME_LABELS[t]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Link
                href="/plan"
                className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
              >
                Ver tu plan
              </Link>
              {!hasCheckin && (
                <Link href="/checkin" className="block w-full text-center text-sm text-gray-500 hover:text-gray-700">
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
              <Link href="/checkin" className="block w-full text-center text-sm text-gray-500 hover:text-gray-700">
                Registrar check-in →
              </Link>
            </>
          )}
        </div>
      )}

      {/* Sync button */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Sincronizando…' : '↻ Sincronizar'}
          </button>
          <a
            href="/api/strava/auth"
            className="text-sm text-orange-500 hover:text-orange-600 py-2 px-3 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 transition-colors"
          >
            Reconectar Strava
          </a>
        </div>
        {syncMsg && (
          <p className="text-xs text-center px-1 text-gray-500">{syncMsg}</p>
        )}
      </div>

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
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">Sin actividades sincronizadas aún</p>
        ) : (
          <div className="space-y-2">
            {history.map((day) => (
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

  const href = mainActivity
    ? `/dashboard/activities/${mainActivity.id}`
    : `/plan?date=${day.date}`;

  return (
    <Link href={href} className="block">
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
