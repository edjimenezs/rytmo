'use client';

import { useEffect, useState } from 'react';

type FeedbackFormState = {
  energy: number;
  hunger: number;
  performance: number;
  digestion: number;
  notes: string;
};

const initialState: FeedbackFormState = {
  energy: 3,
  hunger: 3,
  performance: 3,
  digestion: 3,
  notes: '',
};

const metrics = [
  { key: 'energy' as const, label: 'Energia', hint: '1=sin energia, 5=muy bien' },
  { key: 'hunger' as const, label: 'Hambre', hint: '1=mucha hambre, 5=satisfecho' },
  { key: 'digestion' as const, label: 'Digestion', hint: '1=mala, 5=excelente' },
  { key: 'performance' as const, label: 'Rendimiento', hint: '1=bajo, 5=optimo' },
];

export default function FeedbackForm() {
  const [form, setForm] = useState<FeedbackFormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [recommendationId, setRecommendationId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Load existing feedback
    fetch('/api/feedback')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const fb = data?.feedback;
        if (fb) {
          setForm({
            energy: fb.energy ?? 3,
            hunger: fb.hunger ?? 3,
            performance: fb.performance ?? 3,
            digestion: fb.digestion ?? 3,
            notes: fb.notes ?? '',
          });
          setRecommendationId(fb.recommendationId ?? null);
          setMessage('Feedback cargado. Puedes actualizarlo.');
          setMessageType('info');
        }
      })
      .catch(() => {});

    // Get today's recommendation ID for linking
    fetch('/api/daily-plan')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.plan?.id) return;
        setRecommendationId((prev) => prev ?? data.plan.id);
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
      energy: form.energy,
      hunger: form.hunger,
      performance: form.performance,
      digestion: form.digestion,
      notes: form.notes.trim() || null,
      recommendationId: recommendationId,
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('No se pudo guardar el feedback');
      setMessage('Feedback guardado.');
      setMessageType('success');
    } catch (error) {
      console.error(error);
      setMessage('Error al guardar el feedback.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm text-gray-500">Feedback del dia</p>
        <h2 className="text-2xl font-semibold text-gray-900">Como te fue?</h2>
      </header>

      {message && (
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            messageType === 'error'
              ? 'bg-red-50 text-red-800'
              : messageType === 'success'
                ? 'bg-blue-50 text-blue-800'
                : 'bg-amber-50 text-amber-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              {metric.label} <span className="text-gray-400 font-normal">({metric.hint})</span>
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, [metric.key]: n }))}
                  className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold transition-colors ${
                    form[metric.key] === n
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </p>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Sensaciones, digestion, energia constante..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 disabled:bg-blue-200 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar feedback'}
        </button>
      </form>
    </section>
  );
}
