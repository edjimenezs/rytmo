'use client';

import { useEffect, useState } from 'react';

const sections = [
  { key: 'preWorkout', label: 'Antes de entrenar' },
  { key: 'intraWorkout', label: 'Durante el entrenamiento' },
  { key: 'postWorkout', label: 'Después del entrenamiento' },
  { key: 'lunch', label: 'Almuerzo' },
  { key: 'snack', label: 'Snack' },
  { key: 'dinner', label: 'Cena' },
] as const;

type PlanPayload = {
  summary?: string;
} & Partial<Record<(typeof sections)[number]['key'], string | null>>;

const initialState: PlanPayload = {
  summary: '',
};

export default function PlanForm() {
  const [form, setForm] = useState<PlanPayload>(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/daily-plan')
      .then((response) => {
        if (!response.ok) {
          throw new Error('No hay plan guardado');
        }
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const payload = data?.plan;
        if (!payload) {
          setMessage('Aún no se ha generado ningún plan. Completa el formulario y guárdalo.');
          return;
        }
        const next: PlanPayload = { summary: payload.summary ?? '' };
        sections.forEach((section) => {
          next[section.key] = payload[section.key] ?? '';
        });
        setForm(next);
        setMessage('Plan cargado. Ajusta si quieres y vuelve a guardar.');
      })
      .catch(() => {
        if (active) {
          setMessage('Sin plan diario todavía.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field: keyof PlanPayload) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: PlanPayload = {
      summary: form.summary,
    };
    sections.forEach((section) => {
      payload[section.key] = form[section.key] || null;
    });

    try {
      const response = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('No fue posible guardar el plan');
      }
      setMessage('Plan guardado correctamente.');
    } catch (error) {
      console.error(error);
      setMessage('Error al guardar el plan. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm text-gray-500">Recomendación diaria</p>
        <h2 className="text-2xl font-semibold text-gray-900">Crea o actualiza tu plan</h2>
      </header>

      {message && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm">
        <label className="flex flex-col text-sm text-gray-600">
          Resumen breve
          <textarea
            rows={2}
            required
            className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={form.summary}
            onChange={handleChange('summary')}
            placeholder="Describe el enfoque principal del día"
          />
        </label>

        {sections.map((section) => (
          <label key={section.key} className="flex flex-col text-sm text-gray-600">
            {section.label}
            <textarea
              rows={2}
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={form[section.key] ?? ''}
              onChange={handleChange(section.key)}
              placeholder="Ej: Yogurt + fruta, gel + bebida isotónica..."
            />
          </label>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-200"
          >
            {saving ? 'Guardando...' : 'Guardar plan'}
          </button>
        </div>
      </form>
    </section>
  );
}
