import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { MedicalAgent } from '@/lib/medical/medicalAgent';

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

    // Get all lab values for the user
    const labValues = await prisma.labValue.findMany({
      where: { userId },
      include: {
        document: {
          select: {
            testDate: true,
            title: true,
          },
        },
      },
      orderBy: {
        extractedAt: 'desc',
      },
    });

    if (labValues.length === 0) {
      return NextResponse.json({
        summary: {
          totalTests: 0,
          normalValues: 0,
          abnormalValues: 0,
          criticalValues: 0,
          testsWithTrends: 0,
        },
        trends: [],
        insights: [],
        message: 'No lab values found. Upload and process lab results to see analysis.',
      });
    }

    // Create medical agent
    const agent = new MedicalAgent(labValues);

    // Get analysis
    const summary = agent.getSummary();
    const trends = agent.analyzeTrends();
    const insights = agent.generateInsights();

    return NextResponse.json({
      summary,
      trends,
      insights,
    });
  } catch (error) {
    console.error('Error getting medical analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get medical analysis' },
      { status: 500 }
    );
  }
}

