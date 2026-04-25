import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDailyLoads, calcularAtlCtlAcwr } from '@/lib/training/load';
import { requireAuth } from '@/lib/auth/utils';

function calcularObjetivos(weightKg: number, atl: number) {
  const mantenimiento = weightKg * 32; // kCal aprox moderado
  const extra = atl * 3; // sumar en función de carga reciente
  const calorias = Math.round(mantenimiento + extra);
  const proteina = Math.round(weightKg * 1.6);
  const grasa = Math.round(weightKg * 0.9);
  const carbs = Math.round((calorias - (proteina * 4 + grasa * 9)) / 4);
  return { calorias, proteina, grasa, carbs };
}

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { weight: true },
    });
    const weightKg = profile?.weight ?? 70;

    const loads = await getDailyLoads(userId, 30);
    const { atl } = calcularAtlCtlAcwr(loads);

    const objetivos = calcularObjetivos(weightKg, atl);

    // Distribución simple de comidas: desayuno 25%, almuerzo 35%, cena 30%, snacks 10%
    const split = [
      { name: "Desayuno", ratio: 0.25 },
      { name: "Almuerzo", ratio: 0.35 },
      { name: "Cena", ratio: 0.30 },
      { name: "Snacks", ratio: 0.10 },
    ];

    const meals = split.map((m) => ({
      name: m.name,
      calories: Math.round(objetivos.calorias * m.ratio),
      protein: Math.round(objetivos.proteina * m.ratio),
      carbs: Math.round(objetivos.carbs * m.ratio),
      fat: Math.round(objetivos.grasa * m.ratio),
    }));

    const totals = meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.carbs += meal.carbs;
        acc.protein += meal.protein;
        acc.fat += meal.fat;
        return acc;
      },
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );

    return NextResponse.json({
      weightKg,
      atl: Number(atl.toFixed(1)),
      objetivos,
      totals,
      meals,
    });
  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    return NextResponse.json({ error: 'Failed to generate nutrition plan' }, { status: 500 });
  }
}
