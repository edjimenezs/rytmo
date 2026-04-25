import { NextResponse } from 'next/server';
import { getDailyLoads, calcularAtlCtlAcwr } from '@/lib/training/load';
import { requireAuth } from '@/lib/auth/utils';

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Genera un plan semanal básico a partir de la carga reciente (ATL/CTL).
 * Heurística:
 * - Objetivo semanal = CTL * 7 ajustado por ACWR para no exceder 1.2-1.3.
 * - Distribución: 1 día largo, 1 de intervalos, 2 rodajes, 1 fuerza, 1 técnica, 1 descanso.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const dailyLoads = await getDailyLoads(userId, 60);
    const { atl, ctl, acwr } = calcularAtlCtlAcwr(dailyLoads);

    const cargaObjetivoSemanal = Math.max(ctl * 7 * 0.9, atl * 5); // no bajar demasiado ni subir en exceso
    const acwrCap = acwr > 1.2 ? 0.9 : acwr < 0.8 ? 1.1 : 1.0;
    const cargaSemanaAjustada = cargaObjetivoSemanal * acwrCap;

    const bloques = [
      { tipo: "Rodaje suave", peso: 1 },
      { tipo: "Intervalos", peso: 1.2 },
      { tipo: "Fuerza", peso: 0.8 },
      { tipo: "Tempo/Z3", peso: 1 },
      { tipo: "Técnica/Swim", peso: 0.7 },
      { tipo: "Tirada larga", peso: 1.5 },
      { tipo: "Descanso", peso: 0 },
    ];

    const pesoTotal = bloques.reduce((acc, b) => acc + b.peso, 0);
    const sesiones = bloques.map((b, idx) => {
      const cargaSesion = (cargaSemanaAjustada * b.peso) / pesoTotal;
      const durMin = Math.round((cargaSesion / (atl / 7 || 30)) * 45); // duración estimada relativa a carga reciente
      return {
        day: DAYS[idx],
        session: b.tipo,
        durationMin: b.peso === 0 ? 0 : Math.max(30, Math.min(120, durMin)),
        intensity: b.tipo.includes("Intervalos") ? "Z4-Z5" : b.tipo.includes("Tempo") ? "Z3" : b.tipo.includes("Tirada") ? "Z2" : "Z1-Z2",
        notes: b.tipo === "Descanso" ? "Recuperación / movilidad" : "Ajusta FC/ritmo según sensaciones",
      };
    });

    return NextResponse.json({
      weekLabel: new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date()),
      atl: Number(atl.toFixed(1)),
      ctl: Number(ctl.toFixed(1)),
      acwr: Number(acwr.toFixed(2)),
      sessions: sesiones,
    });
  } catch (error) {
    console.error('Error generating training plan:', error);
    return NextResponse.json({ error: 'Failed to generate training plan' }, { status: 500 });
  }
}
