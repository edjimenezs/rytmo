import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { likedFoods: true, dislikedFoods: true },
    });
    return NextResponse.json({
      likedFoods: profile?.likedFoods ?? [],
      dislikedFoods: profile?.dislikedFoods ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { likedFoods, dislikedFoods } = body as {
      likedFoods?: string[];
      dislikedFoods?: string[];
    };

    const data: { likedFoods?: string[]; dislikedFoods?: string[] } = {};
    if (Array.isArray(likedFoods)) data.likedFoods = likedFoods;
    if (Array.isArray(dislikedFoods)) data.dislikedFoods = dislikedFoods;

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}
