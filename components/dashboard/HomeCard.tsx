'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getActivityIcon } from '@/lib/activity/icon';

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

interface TodayActivity {
  id: string;
  name: string;
  type: string;
  duration: number | null;
  distance: number | null;
  source: string;
  startDate: string;
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
  const [todayActivity, setTodayActivity] = useState<TodayActivity | null>(null);
  const [dayType, setDayType] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
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
          setTodayActivity(planData?.plan?.todayActivity ?? null);
          setDayType(planData?.plan?.dayType ?? null);
          setReasoning(planData?.plan?.reasoning ?? null);
        }
      } catch { /* non-critical */ }
    } catch {
      setTodayState('no_data');
    }
  }, []);

  useEffect(() => {
    loadToday();
    loadHistory();
    fetch('/api/garmin/today-workout')
      .then(r => r.ok ? r.json() : null)
      .then(async (data) => {
        if (!data?.workouts?.length) return;
        setScheduledWorkouts(data.workouts);
        setTodayState('has_data');

        const w = data.workouts[0];
        const typeMap: Record<string, string> = {
          cycling: 'bike', indoor_cycling: 'bike', virtual_ride: 'bike',
          running: 'run', trail_running: 'run',
          swimming: 'swim', open_water_swimming: 'swim',
          strength_training: 'strength', yoga: 'strength',
        };
        const trainingType = typeMap[w.activityTypeKey ?? ''] ?? 'strength';
        const durationMin = w.durationSeconds ? Math.round(w.durationSeconds / 60) : null;

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

  const timeOfDay = checkinData?.timeOfDay ?? null;
  const hasScheduled = scheduledWorkouts.length > 0 || !!planEntry;
  const hasManualTrainingType = !!checkinData?.trainingType;

  return (
    <div className="space-y-4">
      {/* Today card */}
      {todayState === 'loading' ? (
        <div className="rounded-2xl bg-white/5 animate-pulse h-32" />
      ) : (
        <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-4">
          {todayState === 'has_data' ? (
            <>
              {dayType && <DayTypeBadge dayType={dayType} />}

              <h2 className="text-2xl font-semibold text-[#e6edf3]">{headline ?? 'Plan listo'}</h2>

              {todayActivity && (
                <Link
                  href={`/dashboard/activities/${todayActivity.id}`}
                  className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/[0.08] px-3 py-2.5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-xl">{getActivityIcon(todayActivity.type, todayActivity.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e6edf3] truncate">{todayActivity.name}</p>
                    <p className="text-xs text-[#8b949e]">
                      {[fmtDuration(todayActivity.duration), fmtDistance(todayActivity.distance)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-white/20 text-sm">›</span>
                </Link>
              )}

              {(dayType === 'rest' || dayType === 'low') && reasoning && (
                <p className="text-xs text-[#8b949e] line-clamp-2">{reasoning}</p>
              )}

              {!historyLoading && <WeekStrip history={history} />}

              {(scheduledWorkouts.length > 0 || planEntry) && (
                <p className="text-sm text-[#8b949e] flex items-center gap-1.5 flex-wrap">
                  {planEntry ? (
                    <><span>📋</span><span>{planEntry.sessionType} · {planEntry.title}{planEntry.durationMinutes ? ` · ${Math.round(planEntry.durationMinutes)} min` : ''}</span></>
                  ) : scheduledWorkouts.map((w) => (
                    <span key={w.id} className="flex items-center gap-1.5">
                      <span>{TYPE_ICON[w.activityTypeKey?.toUpperCase() ?? ''] ?? '🏋️'}</span>
                      <span>{w.title}{w.durationSeconds ? ` · ${fmtDuration(w.durationSeconds)}` : ''}</span>
                    </span>
                  ))}
                </p>
              )}

              {(hasScheduled || hasManualTrainingType) && (
                <TimeSelector
                  current={timeOfDay}
                  disabled={settingTime}
                  onSelect={handleSetTrainingTime}
                />
              )}

              <Link
                href="/plan"
                className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-violet-600 text-white text-base font-semibold hover:bg-violet-500 transition-colors"
              >
                Ver tu plan
              </Link>
              {!hasCheckin && (
                <Link href="/checkin" className="block w-full text-center text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors">
                  Agregar sueño y fatiga →
                </Link>
              )}
            </>
          ) : (
            <WorkoutPlanner onSave={async (type, durationMin, time) => {
              await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...checkinData, trainingType: type, durationMin, timeOfDay: time }),
              }).catch(() => {});
              setTodayState('loading');
              await loadToday();
            }} />
          )}
        </div>
      )}

      {/* Sync button */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 text-sm text-[#8b949e] hover:text-[#e6edf3] py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Sincronizando…' : '↻ Sincronizar'}
          </button>
          <a
            href="/api/strava/auth"
            className="text-sm text-orange-400 hover:text-orange-300 py-2 px-3 rounded-xl border border-orange-500/30 bg-white/5 hover:bg-orange-900/20 transition-colors"
          >
            Reconectar Strava
          </a>
        </div>
        {syncMsg && (
          <p className="text-xs text-center px-1 text-[#8b949e]">{syncMsg}</p>
        )}
      </div>
    </div>
  );
}


function WeekStrip({ history }: { history: HistoryDay[] }) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]!;
  const dow = now.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const mondayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayMs + i * 86400000);
    return d.toISOString().split('T')[0]!;
  });

  const LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const historyMap = new Map(history.map(d => [d.date, d]));

  const weekSessions = weekDates.filter(d => (historyMap.get(d)?.activities.length ?? 0) > 0).length;
  const weekDuration = weekDates.flatMap(d => historyMap.get(d)?.activities ?? [])
    .reduce((s, a) => s + (a.duration ?? 0), 0);

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide">Esta semana</p>
        {weekSessions > 0 && (
          <p className="text-xs text-[#8b949e]">
            {weekSessions} {weekSessions === 1 ? 'sesión' : 'sesiones'}{weekDuration > 0 ? ` · ${fmtDuration(weekDuration)}` : ''}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        {weekDates.map((date, i) => {
          const activity = historyMap.get(date)?.activities[0] ?? null;
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          return (
            <div key={date} className={`flex-1 flex flex-col items-center gap-0.5 ${isFuture ? 'opacity-25' : ''}`}>
              <span className={`text-[10px] font-semibold ${isToday ? 'text-violet-400' : 'text-[#8b949e]'}`}>
                {LABELS[i]}
              </span>
              <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm ${
                isToday ? 'bg-violet-900/30 ring-2 ring-violet-500/40' : activity ? 'bg-emerald-900/30' : 'bg-white/5'
              }`}>
                {activity
                  ? <span>{getActivityIcon(activity.type, activity.name)}</span>
                  : <span className="w-1.5 h-1.5 rounded-full bg-white/20 block" />}
              </div>
              <span className="text-[9px] text-[#8b949e] w-full text-center truncate">
                {activity ? fmtDuration(activity.duration) : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DAY_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  rest:     { label: 'Recuperación',    className: 'bg-white/10 text-[#8b949e]' },
  low:      { label: 'Carga baja',      className: 'bg-emerald-900/40 text-emerald-400' },
  moderate: { label: 'Carga moderada',  className: 'bg-amber-900/40 text-amber-400' },
  high:     { label: 'Carga alta',      className: 'bg-orange-900/40 text-orange-400' },
};

function DayTypeBadge({ dayType }: { dayType: string }) {
  const config = DAY_TYPE_CONFIG[dayType];
  if (!config) return null;
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function TimeSelector({
  current,
  disabled,
  onSelect,
}: {
  current: string | null;
  disabled: boolean;
  onSelect: (t: 'morning' | 'midday' | 'evening') => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[#8b949e]">¿A qué hora entrenas?</p>
      <div className="flex gap-2">
        {(['morning', 'midday', 'evening'] as const).map((t) => {
          const active = current === t;
          return (
            <button
              key={t}
              onClick={() => onSelect(t)}
              disabled={disabled}
              className={`flex-1 text-sm py-1.5 rounded-xl border transition-colors disabled:opacity-50 ${
                active
                  ? 'bg-violet-600 border-violet-600 text-white font-semibold'
                  : 'border-white/10 bg-white/5 hover:bg-violet-900/20 hover:border-violet-500/50 hover:text-violet-300 text-[#8b949e]'
              }`}
            >
              {TIME_LABELS[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const WORKOUT_TYPES = [
  { key: 'run', label: 'Trote', icon: '🏃' },
  { key: 'bike', label: 'Bici', icon: '🚴' },
  { key: 'swim', label: 'Nado', icon: '🏊' },
  { key: 'strength', label: 'Fuerza', icon: '🏋️' },
];

const DURATION_OPTIONS = [30, 45, 60, 90];

function WorkoutPlanner({ onSave }: {
  onSave: (type: string, durationMin: number, time: 'morning' | 'midday' | 'evening') => Promise<void>;
}) {
  const [type, setType] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [time, setTime] = useState<'morning' | 'midday' | 'evening' | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = !!type && !!duration && !!time;

  return (
    <div className="space-y-4">
      <p className="text-base text-[#8b949e]">¿Qué entrenas hoy?</p>

      <div className="grid grid-cols-4 gap-2">
        {WORKOUT_TYPES.map((w) => (
          <button
            key={w.key}
            onClick={() => setType(w.key)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors text-xs font-medium ${
              type === w.key
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-white/10 bg-white/5 hover:bg-violet-900/20 hover:border-violet-500/50 text-[#8b949e]'
            }`}
          >
            <span className="text-xl">{w.icon}</span>
            {w.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-[#8b949e]">Duración estimada</p>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 text-sm py-1.5 rounded-xl border transition-colors ${
                duration === d
                  ? 'bg-violet-600 border-violet-600 text-white font-semibold'
                  : 'border-white/10 bg-white/5 hover:bg-violet-900/20 hover:border-violet-500/50 text-[#8b949e]'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-[#8b949e]">¿A qué hora?</p>
        <div className="flex gap-2">
          {(['morning', 'midday', 'evening'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`flex-1 text-sm py-1.5 rounded-xl border transition-colors ${
                time === t
                  ? 'bg-violet-600 border-violet-600 text-white font-semibold'
                  : 'border-white/10 bg-white/5 hover:bg-violet-900/20 hover:border-violet-500/50 text-[#8b949e]'
              }`}
            >
              {TIME_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={async () => {
          if (!canSave) return;
          setSaving(true);
          await onSave(type!, duration!, time!);
          setSaving(false);
        }}
        disabled={!canSave || saving}
        className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-violet-600 text-white text-base font-semibold hover:bg-violet-500 transition-colors disabled:opacity-40"
      >
        {saving ? 'Generando plan…' : 'Ver mi plan'}
      </button>
    </div>
  );
}
