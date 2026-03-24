// Run: npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/calibrate-thresholds.ts --email=founder@example.com [--days=14]
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { estimarTssDesdeFc } from '../lib/training/load';
import { subDays, startOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1];
const daysArg = parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] ?? '14', 10);

if (!emailArg) {
  console.error('Usage: npx ts-node scripts/calibrate-thresholds.ts --email=founder@example.com [--days=14]');
  process.exit(1);
}

const normalizeDate = (d: Date) => {
  const n = new Date(d);
  n.setUTCHours(0, 0, 0, 0);
  return n;
};

async function main() {
  const user = await prisma.user.findUnique({ where: { email: emailArg } });
  if (!user) {
    console.error(`User not found: ${emailArg}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const since = startOfDay(subDays(new Date(), daysArg));

  const feedbacks = await prisma.dailyFeedback.findMany({
    where: { userId: user.id, date: { gte: since } },
    include: {
      recommendation: {
        select: { dayType: true, atl: true, ctl: true, acwr: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`\nCalibration report for ${emailArg} — last ${daysArg} days`);
  console.log(`Found ${feedbacks.length} feedback days\n`);
  console.log('DATE       | ENGINE      | TSS          | ENERGIA PERF | ALERTA');
  console.log('-----------|-------------|--------------|--------------|-------');

  let alertCount = 0;

  for (const fb of feedbacks) {
    const dateStr = format(new Date(fb.date), 'yyyy-MM-dd');
    const dayStart = normalizeDate(fb.date);
    const nextDay = new Date(dayStart);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId: user.id,
        startDate: { gte: dayStart, lt: nextDay },
        source: 'STRAVA',
      },
      select: { duration: true, averageHeartRate: true, name: true },
    });

    const tssTotal = activities.reduce((sum, a) =>
      sum + estimarTssDesdeFc(a.duration, a.averageHeartRate), 0
    );

    const engineDayType = fb.recommendation?.dayType ?? 'unknown';
    const energiaScore = fb.energy ?? 'n/a';
    const performanceScore = fb.performance ?? 'n/a';
    const hasHR = activities.some(a => a.averageHeartRate != null);

    let alerta = '';
    if (tssTotal > 100 && (engineDayType === 'rest' || engineDayType === 'low')) {
      alerta = '>>> ENGINE DIJO ' + engineDayType + ' PERO TSS ALTO -> subir threshold?';
      alertCount++;
    } else if (tssTotal > 60 && engineDayType === 'low') {
      alerta = '>>> ENGINE DIJO low_load PERO TSS MODERADO-ALTO';
      alertCount++;
    } else if (typeof energiaScore === 'number' && energiaScore <= 2 && engineDayType === 'high') {
      alerta = '>>> FEEDBACK BAJO con plan high_load -> fueling no alcanzo?';
      alertCount++;
    } else if (tssTotal < 20 && (engineDayType === 'high' || engineDayType === 'moderate')) {
      alerta = '>>> ENGINE DIJO ' + engineDayType + ' PERO TSS MUY BAJO -> bajar threshold?';
      alertCount++;
    }

    console.log(
      `${dateStr} | engine:${engineDayType.padEnd(10)} | TSS:${Math.round(tssTotal).toString().padStart(4)} ${hasHR ? '(HR)' : '(est)'} | energia:${String(energiaScore).padStart(3)} perf:${String(performanceScore).padStart(3)} ${alerta}`
    );
  }

  console.log('\n--- RESUMEN ---');
  console.log(`Dias analizados: ${feedbacks.length}`);

  const energyFbs = feedbacks.filter(f => f.energy != null);
  const avgEnergy = energyFbs.length > 0
    ? energyFbs.reduce((s, f) => s + (f.energy ?? 0), 0) / energyFbs.length
    : 0;

  const perfFbs = feedbacks.filter(f => f.performance != null);
  const avgPerf = perfFbs.length > 0
    ? perfFbs.reduce((s, f) => s + (f.performance ?? 0), 0) / perfFbs.length
    : 0;

  console.log(`Energia promedio: ${avgEnergy.toFixed(1)}/5`);
  console.log(`Performance promedio: ${avgPerf.toFixed(1)}/5`);
  console.log(`Discrepancias detectadas: ${alertCount}`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
