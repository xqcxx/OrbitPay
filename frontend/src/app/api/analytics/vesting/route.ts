import { NextResponse } from 'next/server';

import { getVestingAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getVestingAnalytics());
}
