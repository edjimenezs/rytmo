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
  timeOfDay: '' as string, // '' means "use profile default"
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

  useEffect(() => {
    let active = true;

    fetch('/api/checkin')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (!active) return;
        const checkin = data?.checkin;

        if (checkin) {
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

        // No manual check-in — try to pre-fill from today's activity
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

    // Fetch profile default training time
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
  }, []);

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

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm text-gray-500">Registro diario</p>
        <h2 className="text-2xl font-semibold text-gray-900">Cómo llega tu cuerpo hoy</h2>
      </header>

      {activitySources.length > 0 && (
        <div className="rounded-2xl px-4 py-3 text-sm bg-green-50 text-green-800 flex items-center gap-2">
          <span>✓</span>
          <span>
            Datos de entrenamiento importados desde{' '}
            <strong>{activitySources.map((s) => SOURCE_LABEL[s] ?? s).join(' y ')}</strong>.
            Revisa y ajusta si es necesario.
          </span>
        </div>
      )}

      {message && (
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Campo 1: Tipo de entrenamiento */}
        <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Tipo de entrenamiento</p>
          <div className="flex flex-wrap gap-2">
            {trainingTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, trainingType: t.value }))}
                className={`min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  form.trainingType === t.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campo 2: Duración (oculto si descanso) */}
        {!isRest && (
          <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Duración</p>
              <span className="text-sm font-bold text-blue-600">{form.durationMin} min</span>
            </div>
            <div className="flex gap-2 mb-3">
              {durationPresets.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, durationMin: d }))}
                  className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold transition-colors ${
                    form.durationMin === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="w-full accent-blue-600"
            />
          </div>
        )}

        {/* Campo 3: Intensidad (oculto si descanso) */}
        {!isRest && (
          <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Intensidad</p>
            <div className="flex gap-2">
              {intensityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, intensity: opt.value }))}
                  className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold transition-colors ${
                    form.intensity === opt.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Campo 4: Hora de entrenamiento (oculto si descanso) */}
        {!isRest && (
          <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Hora de entrenamiento de hoy
            </p>
            <p className="text-xs text-gray-400">
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Campo 5: Sueño */}
        <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Horas de sueño</p>
            <span className="text-sm font-bold text-blue-600">{form.sleepHours} h</span>
          </div>
          <input
            type="range"
            min={4}
            max={12}
            step={0.5}
            value={form.sleepHours}
            onChange={(e) => setForm((prev) => ({ ...prev, sleepHours: Number(e.target.value) }))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>4 h</span>
            <span>12 h</span>
          </div>
        </div>

        {/* Campo 6: Fatiga */}
        <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Fatiga <span className="text-gray-400 font-normal">(1=fresh, 5=destruido)</span></p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, fatigue: n }))}
                className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold transition-colors ${
                  form.fatigue === n
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Fecha oculta */}
        <input type="hidden" value={form.date} />

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 disabled:bg-blue-200 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar check-in'}
        </button>
      </form>
    </section>
  );
}
