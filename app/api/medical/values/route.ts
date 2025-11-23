import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

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
    const { searchParams } = new URL(request.url);
    const testName = searchParams.get('testName');

    const where: any = { userId };
    if (testName) {
      where.testName = testName;
    }

    const labValues = await prisma.labValue.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            testDate: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: {
        extractedAt: 'desc',
      },
    });

    // Group by test name for easier consumption
    const groupedByTest = labValues.reduce((acc, value) => {
      if (!acc[value.testName]) {
        acc[value.testName] = [];
      }
      acc[value.testName].push(value);
      return acc;
    }, {} as Record<string, typeof labValues>);

    return NextResponse.json({
      labValues,
      groupedByTest,
      total: labValues.length,
    });
  } catch (error) {
    console.error('Error fetching lab values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab values' },
      { status: 500 }
    );
  }
}


