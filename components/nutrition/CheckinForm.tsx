'use client';

import { useEffect, useState } from 'react';

const trainingTypes = [
  { label: 'Bici', value: 'bike' },
  { label: 'Correr', value: 'run' },
  { label: 'Nadar', value: 'swim' },
  { label: 'Tri', value: 'tri' },
  { label: 'Descanso', value: 'rest' },
];

const intensityOptions = [
  { label: 'Baja', value: 'Low' },
  { label: 'Moderada', value: 'Moderate' },
  { label: 'Alta', value: 'High' },
];

const durationPresets = [30, 60, 90, 120];

const initialState = {
  date: new Date().toISOString().slice(0, 10),
  trainingType: '',
  durationMin: 60,
  intensity: 'Moderate',
  sleepHours: 7.5,
  fatigue: 3,
  timeOfDay: '' as string,
};

type CheckinFormState = typeof initialState;

const SOURCE_LABEL: Record<string, string> = {
  STRAVA: 'Strava',
  GARMIN: 'Garmin',
  TRAINING_PEAKS: 'TrainingPeaks',
  OTHER_APP: 'otra app',
  MANUAL: 'entrada manual',
};

export default function CheckinForm() {
  const [form, setForm] = useState<CheckinFormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');
  const [profileDefault, setProfileDefault] = useState<string>('');
  const [activitySources, setActivitySources] = useState<string[]>([]);
  const [hasSavedCheckin, setHasSavedCheckin] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const resetCheckin = async () => {
    await fetch('/api/checkin', { method: 'DELETE' });
    setHasSavedCheckin(false);
    setMessage(null);
    setForm(initialState);
    setActivitySources([]);
    setLoadKey((k) => k + 1);
  };

  useEffect(() => {
    let active = true;

    fetch('/api/checkin')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (!active) return;
        const checkin = data?.checkin;

        if (checkin) {
          setHasSavedCheckin(true);
          setForm((prev) => ({
            ...prev,
            date: checkin.date ? new Date(checkin.date).toISOString().slice(0, 10) : prev.date,
            trainingType: checkin.trainingType ?? prev.trainingType,
            durationMin: checkin.durationMin ?? prev.durationMin,
            intensity: checkin.intensity ?? prev.intensity,
            sleepHours: checkin.sleepHours ?? prev.sleepHours,
            fatigue: checkin.fatigue ?? prev.fatigue,
            timeOfDay: checkin.timeOfDay ?? prev.timeOfDay,
          }));
          setMessage('Datos cargados. Puedes actualizar y guardar de nuevo.');
          setMessageType('info');
          return;
        }

        const actRes = await fetch('/api/checkin/from-activity').catch(() => null);
        if (!active) return;
        const actData = actRes?.ok ? await actRes.json() : null;
        const activity = actData?.activity;

        if (activity) {
          setForm((prev) => ({
            ...prev,
            trainingType: activity.trainingType ?? prev.trainingType,
            durationMin: activity.durationMin ?? prev.durationMin,
            intensity: activity.intensity ?? prev.intensity,
          }));
          setActivitySources(activity.sources ?? []);
          setMessage(null);
        } else {
          setMessage('Sin actividad registrada hoy. Completa el formulario manualmente.');
          setMessageType('info');
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Sin check-in previo para hoy.');
          setMessageType('info');
        }
      });

    fetch('/api/daily-plan')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.plan?.trainingTime) return;
        setProfileDefault(data.plan.trainingTime);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [loadKey]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      date: form.date,
      trainingType: form.trainingType || null,
      durationMin: form.trainingType === 'rest' ? null : form.durationMin,
      intensity: form.trainingType === 'rest' ? null : form.intensity,
      sleepHours: form.sleepHours,
      fatigue: form.fatigue,
      timeOfDay: form.timeOfDay || null,
    };

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('No se pudo guardar el check-in');
      setMessage('Check-in guardado correctamente.');
      setMessageType('info');
    } catch (error) {
      console.error(error);
      setMessage('Error al guardar el check-in. Intenta de nuevo.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const isRest = form.trainingType === 'rest';
  const hasAutoActivity = activitySources.length > 0;

  const trainingTypeLabel = trainingTypes.find((t) => t.value === form.trainingType)?.label ?? form.trainingType;
  const intensityLabel = intensityOptions.find((o) => o.value === form.intensity)?.label ?? form.intensity;

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm text-[#8b949e]">Registro diario</p>
        <h2 className="text-2xl font-semibold text-[#e6edf3]">Cómo llega tu cuerpo hoy</h2>
      </header>

      {hasAutoActivity && (
        <div className="rounded-2xl px-4 py-3 text-sm bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <span>✓</span>
            <span>
              Entrenamiento detectado desde{' '}
              {activitySources.map((s) => SOURCE_LABEL[s] ?? s).join(' y ')}
            </span>
          </div>
          {form.trainingType && (
            <p className="text-emerald-400/70 pl-6">
              {trainingTypeLabel}
              {!isRest && ` · ${form.durationMin} min · ${intensityLabel}`}
            </p>
          )}
        </div>
      )}

      {message && (
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            messageType === 'error'
              ? 'bg-red-900/20 border border-red-500/20 text-red-400'
              : 'bg-white/5 border border-white/10 text-[#8b949e]'
          }`}
        >
          {message}
        </div>
      )}

      {hasSavedCheckin && (
        <button
          type="button"
          onClick={resetCheckin}
          className="w-full text-sm text-[#8b949e] hover:text-red-400 transition-colors"
        >
          Resetear y cargar desde Garmin/Strava
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {!hasAutoActivity && (
          <>
            <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-3">
              <p className="text-sm font-semibold text-[#e6edf3]">Tipo de entrenamiento</p>
              <div className="flex flex-wrap gap-2">
                {trainingTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, trainingType: t.value }))}
                    className={`min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      form.trainingType === t.value
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 border border-white/10 text-[#8b949e] hover:bg-violet-900/20 hover:border-violet-500/50 hover:text-violet-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {!isRest && (
              <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#e6edf3]">Duración</p>
                  <span className="text-sm font-bold text-violet-400">{form.durationMin} min</span>
                </div>
                <div className="flex gap-2 mb-3">
                  {durationPresets.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, durationMin: d }))}
                      className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold transition-colors ${
                        form.durationMin === d
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 border border-white/10 text-[#8b949e] hover:bg-violet-900/20'
                      }`}
                    >
                      {d === 120 ? '120+' : `${d}`}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={0}
                  max={240}
                  step={5}
                  value={form.durationMin}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationMin: Number(e.target.value) }))}
                  className="w-full accent-violet-500"
                />
              </div>
            )}

            {!isRest && (
              <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-3">
                <p className="text-sm font-semibold text-[#e6edf3]">Intensidad</p>
                <div className="flex gap-2">
                  {intensityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, intensity: opt.value }))}
                      className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold transition-colors ${
                        form.intensity === opt.value
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 border border-white/10 text-[#8b949e] hover:bg-violet-900/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isRest && (
              <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-3">
                <p className="text-sm font-semibold text-[#e6edf3]">
                  Hora de entrenamiento de hoy
                </p>
                <p className="text-xs text-[#8b949e]">
                  Opcional — solo si es diferente a tu default
                  {profileDefault
                    ? ` (${
                        profileDefault === 'morning'
                          ? 'manana'
                          : profileDefault === 'midday'
                            ? 'mediodia'
                            : 'tarde-noche'
                      })`
                    : ''}
                </p>
                <div className="flex gap-2">
                  {[
                    { label: 'Manana', value: 'morning' },
                    { label: 'Mediodia', value: 'midday' },
                    { label: 'Tarde-noche', value: 'evening' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          timeOfDay: prev.timeOfDay === opt.value ? '' : opt.value,
                        }))
                      }
                      className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold transition-colors ${
                        form.timeOfDay === opt.value
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 border border-white/10 text-[#8b949e] hover:bg-violet-900/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#e6edf3]">Horas de sueño</p>
            <span className="text-sm font-bold text-violet-400">{form.sleepHours} h</span>
          </div>
          <input
            type="range"
            min={4}
            max={12}
            step={0.5}
            value={form.sleepHours}
            onChange={(e) => setForm((prev) => ({ ...prev, sleepHours: Number(e.target.value) }))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-[#8b949e]">
            <span>4 h</span>
            <span>12 h</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-5 space-y-3">
          <p className="text-sm font-semibold text-[#e6edf3]">Fatiga <span className="text-[#8b949e] font-normal">(1=fresh, 5=destruido)</span></p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, fatigue: n }))}
                className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold transition-colors ${
                  form.fatigue === n
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 border border-white/10 text-[#8b949e] hover:bg-violet-900/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <input type="hidden" value={form.date} />

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] rounded-2xl bg-violet-600 text-white text-base font-semibold hover:bg-violet-500 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar check-in'}
        </button>
      </form>
    </section>
  );
}
