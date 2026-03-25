import { NextResponse } from 'next/server';

import { getTreasuryAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getTreasuryAnalytics());
}
