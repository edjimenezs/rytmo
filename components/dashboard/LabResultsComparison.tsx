'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

interface LabValue {
  id: string;
  testName: string;
  value: number;
  unit?: string | null;
  referenceRange?: string | null;
  status?: string | null;
  testDate?: string | null;
  extractedAt: string;
  document: {
    id: string;
    title: string;
    testDate: string | null;
    uploadedAt: string;
  };
}

interface ComparisonRow {
  testName: string;
  latest: LabValue;
  previous?: LabValue;
  changePercent?: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  history: LabValue[];
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return format(new Date(value), 'dd/MM/yyyy');
}

function formatLabValue(value?: LabValue) {
  if (!value) return '—';
  const numeric = typeof value.value === 'number' ? value.value : Number(value.value);
  const rounded =
    Number.isFinite(numeric) && Math.abs(numeric) >= 1 ? numeric.toFixed(1) : numeric.toPrecision(2);
  return `${rounded}${value.unit ? ` ${value.unit}` : ''}`;
}

function getStatusBadgeClasses(status?: string | null) {
  switch (status) {
    case 'CRÍTICO':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'ALTO':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'BAJO':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'NORMAL':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function getTrendIcon(trend: ComparisonRow['trend']) {
  switch (trend) {
    case 'UP':
      return '📈';
    case 'DOWN':
      return '📉';
    default:
      return '➡️';
  }
}

export default function LabResultsComparison() {
  const [groupedValues, setGroupedValues] = useState<Record<string, LabValue[]>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchValues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/medical/values');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudieron cargar los valores de laboratorio.');
      }
      const data = await response.json();
      setGroupedValues(data.groupedByTest || {});
    } catch (err: any) {
      console.error('Error fetching lab values', err);
      setError(err.message || 'No se pudieron cargar los valores de laboratorio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValues();
  }, []);

  const processAllLabResults = async () => {
    setProcessing(true);
    setError(null);
    try {
      const docsResp = await fetch('/api/medical?type=LAB_RESULT');
      if (!docsResp.ok) {
        throw new Error('No se pudieron obtener los documentos de laboratorio.');
      }
      const docsData = await docsResp.json();
      const docs = (docsData.documents || []) as { id: string }[];

      for (const doc of docs) {
        await fetch('/api/medical/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: doc.id }),
        });
      }

      await fetchValues();
    } catch (err: any) {
      console.error('Error processing lab results', err);
      setError(err.message || 'No se pudieron procesar los exámenes.');
    } finally {
      setProcessing(false);
    }
  };

  const comparisons: ComparisonRow[] = useMemo(() => {
    return Object.entries(groupedValues).map(([testName, values]) => {
      const sorted = [...values].sort((a, b) => {
        const dateA = new Date(a.document.testDate || a.extractedAt).getTime();
        const dateB = new Date(b.document.testDate || b.extractedAt).getTime();
        return dateB - dateA;
      });

      const latest = sorted[0];
      const previous = sorted[1];

      let changePercent: number | undefined;
      let trend: ComparisonRow['trend'] = 'STABLE';

      if (latest && previous) {
        changePercent = previous.value !== 0 ? ((latest.value - previous.value) / previous.value) * 100 : undefined;
        if (changePercent && Math.abs(changePercent) > 2) {
          trend = changePercent > 0 ? 'UP' : 'DOWN';
        }
      }

      return {
        testName,
        latest,
        previous,
        changePercent,
        trend,
        history: sorted.slice(0, 5),
      };
    });
  }, [groupedValues]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const showEmpty = comparisons.length === 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Comparación de resultados entre exámenes</h3>
          <p className="text-sm text-gray-500">
            Últimas mediciones por prueba con cambio frente al examen anterior y pequeño historial.
          </p>
        </div>
        <div className="text-2xl">📊</div>
      </div>
      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {showEmpty ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🧪</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">Compara tus resultados</h3>
              <p className="text-blue-800 text-sm mb-3">
                Procesa al menos dos exámenes de laboratorio para ver la comparación entre resultados y su tendencia.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={processAllLabResults}
                  disabled={processing}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                >
                  {processing ? 'Procesando...' : 'Procesar exámenes ahora'}
                </button>
                <button
                  onClick={fetchValues}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50"
                >
                  Refrescar comparaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {comparisons.map((row) => (
            <div key={row.testName} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{row.testName}</h4>
                  <p className="text-xs text-gray-500">Comparación entre últimos exámenes</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadgeClasses(row.latest.status)}`}>
                  {row.latest.status || 'SIN ESTADO'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Último</div>
                  <div className="font-semibold text-gray-900">{formatLabValue(row.latest)}</div>
                  <div className="text-xs text-gray-500 truncate">{row.latest.document.title}</div>
                  <div className="text-[11px] text-gray-400">{formatDate(row.latest.document.testDate || row.latest.testDate)}</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Anterior</div>
                  {row.previous ? (
                    <>
                      <div className="font-semibold text-gray-900">{formatLabValue(row.previous)}</div>
                      <div className="text-xs text-gray-500 truncate">{row.previous.document.title}</div>
                      <div className="text-[11px] text-gray-400">
                        {formatDate(row.previous.document.testDate || row.previous.testDate)}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-xs">Solo hay una medición</div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Cambio</div>
                  {row.previous && row.changePercent !== undefined ? (
                    <div className={`text-sm font-semibold ${row.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {row.changePercent > 0 ? '+' : ''}
                      {row.changePercent.toFixed(1)}%
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs">N/A</div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                    <span>{getTrendIcon(row.trend)}</span>
                    <span>
                      {row.trend === 'UP' && 'Subiendo'}
                      {row.trend === 'DOWN' && 'Bajando'}
                      {row.trend === 'STABLE' && 'Estable'}
                    </span>
                  </div>
                  {row.latest.referenceRange && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      Rango ref: {row.latest.referenceRange}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">Historial reciente</div>
                <div className="flex flex-wrap gap-2">
                  {row.history.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 border border-gray-200"
                    >
                      {formatDate(item.document.testDate || item.testDate)} · {formatLabValue(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
