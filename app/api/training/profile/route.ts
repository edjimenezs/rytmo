import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';

// Placeholder profile; ideally pull from user profile or preferences.
const DEFAULT_PROFILE = {
  nombre: 'Atleta',
  fcReposo: 50,
  fcMax: 185,
  ftp: 250,
  vt1: 135,
  vt2: 160,
};

export async function GET() {
  await requireAuth();

  // TODO: read from Profile table once FC/FTP fields exist.
  return NextResponse.json(DEFAULT_PROFILE);
}
