import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

type ActivitySourceValue = 'MANUAL' | 'STRAVA' | 'TRAINING_PEAKS' | 'OTHER_APP';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') as ActivitySourceValue | null;
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { userId };
    
    if (source) {
      // Filter by source (string literal to avoid enum issues on client generation)
      where.source = source as ActivitySourceValue;
    }

    const activities = await prisma.trainingActivity.findMany({
      where,
      orderBy: {
        startDate: 'desc',
      },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        source: true,
        distance: true,
        duration: true,
        elevation: true,
        calories: true,
        averageHeartRate: true,
        maxHeartRate: true,
        averagePace: true,
        startDate: true,
        endDate: true,
      },
    });

    const totalCount = await prisma.trainingActivity.count({
      where,
    });

    return NextResponse.json({
      activities,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
