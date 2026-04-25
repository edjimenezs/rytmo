import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const testName = searchParams.get('testName');

    const where: Prisma.LabValueWhereInput = { userId };
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
