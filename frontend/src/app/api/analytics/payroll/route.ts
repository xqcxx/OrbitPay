import { NextResponse } from 'next/server';

import { getPayrollAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getPayrollAnalytics());
}
