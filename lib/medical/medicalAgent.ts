import { LabValue } from '@prisma/client';

interface LabValueWithDocument extends LabValue {
  document: {
    testDate: Date | null;
    title: string;
  };
}

interface TrendAnalysis {
  testName: string;
  currentValue: number;
  previousValue?: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changePercent?: number;
  status: string;
  recommendation?: string;
}

interface MedicalInsight {
  type: 'WARNING' | 'INFO' | 'SUCCESS' | 'CRITICAL';
  title: string;
  message: string;
  testName?: string;
  recommendation?: string;
}

export class MedicalAgent {
  private labValues: LabValueWithDocument[];

  constructor(labValues: LabValueWithDocument[]) {
    this.labValues = labValues.sort((a, b) => {
      const dateA = a.document.testDate || a.extractedAt;
      const dateB = b.document.testDate || b.extractedAt;
      return dateB.getTime() - dateA.getTime();
    });
  }

  analyzeTrends(): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const groupedByTest = this.groupByTestName();

    for (const [testName, values] of Object.entries(groupedByTest)) {
      if (values.length < 2) continue; // Need at least 2 values to show trend

      const sorted = values.sort((a, b) => {
        const dateA = a.document.testDate || a.extractedAt;
        const dateB = b.document.testDate || b.extractedAt;
        return dateB.getTime() - dateA.getTime();
      });

      const current = sorted[0];
      const previous = sorted[1];

      const change = current.value - previous.value;
      const changePercent = previous.value !== 0 
        ? (change / previous.value) * 100 
        : undefined;

      let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
      if (changePercent) {
        if (Math.abs(changePercent) < 5) {
          trend = 'STABLE';
        } else if (changePercent > 0) {
          trend = 'INCREASING';
        } else {
          trend = 'DECREASING';
        }
      }

      trends.push({
        testName,
        currentValue: current.value,
        previousValue: previous.value,
        trend,
        changePercent,
        status: current.status || 'NORMAL',
      });
    }

    return trends;
  }

  generateInsights(): MedicalInsight[] {
    const insights: MedicalInsight[] = [];
    const trends = this.analyzeTrends();
    const latestValues = this.getLatestValues();

    // Check for critical values
    for (const value of latestValues) {
      if (value.status === 'CRÍTICO') {
        insights.push({
          type: 'CRITICAL',
          title: `Valor Crítico: ${value.testName}`,
          message: `El valor de ${value.testName} (${value.value} ${value.unit}) está fuera del rango crítico.`,
          testName: value.testName,
          recommendation: 'Consulta inmediata con tu médico es recomendada.',
        });
      } else if (value.status === 'ALTO' || value.status === 'BAJO') {
        insights.push({
          type: 'WARNING',
          title: `Valor Anormal: ${value.testName}`,
          message: `El valor de ${value.testName} (${value.value} ${value.unit}) está fuera del rango normal.`,
          testName: value.testName,
          recommendation: 'Considera consultar con tu médico para revisar este resultado.',
        });
      }
    }

    // Check for significant trends - only alert if change is significant AND outside normal range
    for (const trend of trends) {
      if (trend.changePercent && Math.abs(trend.changePercent) > 30) {
        // Only create insight if:
        // 1. Change is significant (>30%)
        // 2. Current value is outside normal range OR previous value was outside normal range
        const isCurrentlyAbnormal = trend.status === 'ALTO' || trend.status === 'BAJO' || trend.status === 'CRÍTICO';
        const isImproving = (trend.status === 'ALTO' && trend.trend === 'DECREASING') ||
                          (trend.status === 'BAJO' && trend.trend === 'INCREASING');

        if (isImproving && isCurrentlyAbnormal) {
          insights.push({
            type: 'SUCCESS',
            title: `Mejora en ${trend.testName}`,
            message: `${trend.testName} ha mejorado ${Math.abs(trend.changePercent).toFixed(1)}% desde la última medición y se está acercando al rango normal.`,
            testName: trend.testName,
          });
        } else if (Math.abs(trend.changePercent) > 50 && isCurrentlyAbnormal) {
          // Only warn if change is >50% AND value is abnormal
          insights.push({
            type: 'WARNING',
            title: `Cambio Significativo en ${trend.testName}`,
            message: `${trend.testName} ha cambiado ${Math.abs(trend.changePercent).toFixed(1)}% desde la última medición y está fuera del rango normal.`,
            testName: trend.testName,
            recommendation: 'Es importante monitorear este cambio y consultar con tu médico.',
          });
        }
      }
    }

    // Check for patterns across multiple tests
    const cholesterolValues = latestValues.filter(v => 
      v.testName.includes('Colesterol') || v.testName.includes('Triglicéridos')
    );
    if (cholesterolValues.length >= 2) {
      const hasHighCholesterol = cholesterolValues.some(v => 
        v.status === 'ALTO' || v.status === 'CRÍTICO'
      );
      if (hasHighCholesterol) {
        insights.push({
          type: 'WARNING',
          title: 'Perfil Lipídico',
          message: 'Algunos valores de tu perfil lipídico están elevados.',
          recommendation: 'Considera ajustar tu dieta y aumentar la actividad física. Consulta con un nutricionista.',
        });
      }
    }

    return insights;
  }

  private groupByTestName(): Record<string, LabValueWithDocument[]> {
    const grouped: Record<string, LabValueWithDocument[]> = {};
    for (const value of this.labValues) {
      if (!grouped[value.testName]) {
        grouped[value.testName] = [];
      }
      grouped[value.testName].push(value);
    }
    return grouped;
  }

  private getLatestValues(): LabValueWithDocument[] {
    const grouped = this.groupByTestName();
    const latest: LabValueWithDocument[] = [];
    
    for (const values of Object.values(grouped)) {
      const sorted = values.sort((a, b) => {
        const dateA = a.document.testDate || a.extractedAt;
        const dateB = b.document.testDate || b.extractedAt;
        return dateB.getTime() - dateA.getTime();
      });
      latest.push(sorted[0]);
    }
    
    return latest;
  }

  getSummary(): {
    totalTests: number;
    normalValues: number;
    abnormalValues: number;
    criticalValues: number;
    testsWithTrends: number;
  } {
    const latest = this.getLatestValues();
    const trends = this.analyzeTrends();

    return {
      totalTests: latest.length,
      normalValues: latest.filter(v => v.status === 'NORMAL').length,
      abnormalValues: latest.filter(v => v.status === 'ALTO' || v.status === 'BAJO').length,
      criticalValues: latest.filter(v => v.status === 'CRÍTICO').length,
      testsWithTrends: trends.length,
    };
  }
}
