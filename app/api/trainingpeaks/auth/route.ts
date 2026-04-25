import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { trainingPeaksClient } from '@/lib/trainingpeaks/client';

export async function GET() {
  try {
    const user = await requireAuth();
    const authUrl = trainingPeaksClient.getAuthorizationUrl(user.id);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating TrainingPeaks auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate TrainingPeaks authorization' },
      { status: 500 }
    );
  }
}
