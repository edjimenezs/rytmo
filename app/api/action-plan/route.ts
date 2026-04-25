import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { buildActionPlan } from '@/lib/action-plan/plan';

function normalizeDateParam(dateString?: string | null) {
  if (!dateString) return undefined;
  const candidate = new Date(dateString);
  if (Number.isNaN(candidate.getTime())) {
    throw new Error('Invalid date');
  }
  return candidate;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dateParam = req.nextUrl.searchParams.get('date');
    const date = normalizeDateParam(dateParam);
    const plan = await buildActionPlan(user.id, date ?? undefined);
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build action plan';
    const status = message === 'Invalid date' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
