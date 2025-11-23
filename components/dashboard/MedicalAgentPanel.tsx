'use client';

import { useEffect, useState } from 'react';

interface Trend {
  testName: string;
  currentValue: number;
  previousValue?: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changePercent?: number;
  status: string;
}

interface Insight {
  type: 'WARNING' | 'INFO' | 'SUCCESS' | 'CRITICAL';
  title: string;
  message: string;
  testName?: string;
  recommendation?: string;
}

interface Summary {
  totalTests: number;
  normalValues: number;
  abnormalValues: number;
  criticalValues: number;
  testsWithTrends: number;
}

export default function MedicalAgentPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch('/api/medical/analysis');
        if (response.ok) {
          const data = await response.json();
          setSummary(data.summary);
          setTrends(data.trends || []);
          setInsights(data.insights || []);
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!summary || summary.totalTests === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-3xl mr-4">👨‍⚕️</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Agente Médico
            </h3>
            <p className="text-blue-800">
              Sube y procesa resultados de laboratorio para recibir análisis automático y seguimiento de tendencias.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return '🚨';
      case 'WARNING':
        return '⚠️';
      case 'SUCCESS':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'SUCCESS':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return '📈';
      case 'DECREASING':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return 'text-red-600 font-bold';
      case 'ALTO':
      case 'BAJO':
        return 'text-yellow-600 font-semibold';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="text-4xl mr-3">👨‍⚕️</div>
            <div>
              <h2 className="text-2xl font-bold">Agente Médico</h2>
              <p className="text-blue-100">Análisis automático de tus resultados</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Total de Pruebas</div>
            <div className="text-2xl font-bold">{summary.totalTests}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Valores Normales</div>
            <div className="text-2xl font-bold text-green-200">{summary.normalValues}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Valores Anormales</div>
            <div className="text-2xl font-bold text-yellow-200">{summary.abnormalValues}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm text-blue-100">Valores Críticos</div>
            <div className="text-2xl font-bold text-red-200">{summary.criticalValues}</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Insights y Recomendaciones
          </h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm mb-2">{insight.message}</p>
                    {insight.recommendation && (
                      <p className="text-sm font-medium mt-2">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends - Compact View */}
      {trends.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Tendencias
          </h3>
          <div className="space-y-2">
            {trends.map((trend, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{getTrendIcon(trend.trend)}</span>
                    <span className="font-medium text-gray-900 text-sm truncate">{trend.testName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(trend.status)}`}>
                      {trend.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-gray-600">
                      <span className="font-semibold">{trend.currentValue.toFixed(1)}</span>
                      {trend.previousValue !== undefined && (
                        <span className="text-gray-400 ml-1">
                          ({trend.previousValue.toFixed(1)})
                        </span>
                      )}
                    </div>
                    {trend.changePercent !== undefined && Math.abs(trend.changePercent) > 5 && (
                      <div
                        className={`font-medium ${
                          trend.changePercent > 0
                            ? 'text-red-600'
                            : trend.changePercent < 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {trend.changePercent > 0 ? '+' : ''}
                        {trend.changePercent.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && trends.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            Sube más resultados de laboratorio para ver análisis y tendencias.
          </p>
        </div>
      )}
    </div>
  );
}

