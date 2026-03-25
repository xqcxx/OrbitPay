export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface PayrollAnalyticsResponse {
  generatedAt: string;
  granularity: 'month';
  currency: string;
  summary: {
    totalDisbursed: number;
    activeStreams: number;
    burnRate: number;
  };
  series: {
    disbursements: TimeSeriesPoint[];
    cumulativeDisbursements: TimeSeriesPoint[];
    activeStreams: TimeSeriesPoint[];
    burnRate: TimeSeriesPoint[];
  };
}

export interface TreasuryAnalyticsResponse {
  generatedAt: string;
  granularity: 'month';
  currency: string;
  summary: {
    currentBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
  };
  series: {
    balance: TimeSeriesPoint[];
    deposits: TimeSeriesPoint[];
    withdrawals: TimeSeriesPoint[];
    netFlow: TimeSeriesPoint[];
  };
}

export interface VestingCliff {
  beneficiary: string;
  amount: number;
  timestamp: string;
  daysUntilCliff: number;
}

export interface VestingAnalyticsResponse {
  generatedAt: string;
  granularity: 'month';
  currency: string;
  summary: {
    totalVestingValue: number;
    upcomingCliffs: number;
    nextCliffAt: string | null;
  };
  series: {
    totalVestingValue: TimeSeriesPoint[];
    cliffAmounts: TimeSeriesPoint[];
  };
  upcomingCliffs: VestingCliff[];
}

type MonthlyDisbursement = {
  timestamp: string;
  disbursement: number;
  activeStreams: number;
};

type MonthlyTreasuryFlow = {
  timestamp: string;
  deposits: number;
  withdrawals: number;
};

type VestingGrant = {
  createdAt: string;
  cliffAt: string;
  beneficiary: string;
  amount: number;
};

const PAYROLL_MONTHLY_DISBURSEMENTS: MonthlyDisbursement[] = [
  { timestamp: '2025-10-01T00:00:00.000Z', disbursement: 12000, activeStreams: 4 },
  { timestamp: '2025-11-01T00:00:00.000Z', disbursement: 18000, activeStreams: 5 },
  { timestamp: '2025-12-01T00:00:00.000Z', disbursement: 25000, activeStreams: 8 },
  { timestamp: '2026-01-01T00:00:00.000Z', disbursement: 22000, activeStreams: 8 },
  { timestamp: '2026-02-01T00:00:00.000Z', disbursement: 30000, activeStreams: 10 },
  { timestamp: '2026-03-01T00:00:00.000Z', disbursement: 45000, activeStreams: 12 },
];

const TREASURY_MONTHLY_FLOW: MonthlyTreasuryFlow[] = [
  { timestamp: '2025-10-01T00:00:00.000Z', deposits: 180000, withdrawals: 25000 },
  { timestamp: '2025-11-01T00:00:00.000Z', deposits: 120000, withdrawals: 42000 },
  { timestamp: '2025-12-01T00:00:00.000Z', deposits: 90000, withdrawals: 56000 },
  { timestamp: '2026-01-01T00:00:00.000Z', deposits: 150000, withdrawals: 68000 },
  { timestamp: '2026-02-01T00:00:00.000Z', deposits: 110000, withdrawals: 74000 },
  { timestamp: '2026-03-01T00:00:00.000Z', deposits: 130000, withdrawals: 50000 },
];

const STARTING_TREASURY_BALANCE = 800000;

const VESTING_GRANTS: VestingGrant[] = [
  {
    createdAt: '2025-09-01T00:00:00.000Z',
    cliffAt: '2026-09-01T00:00:00.000Z',
    beneficiary: 'team-alpha',
    amount: 100000,
  },
  {
    createdAt: '2025-11-01T00:00:00.000Z',
    cliffAt: '2026-05-01T00:00:00.000Z',
    beneficiary: 'advisor-beta',
    amount: 50000,
  },
  {
    createdAt: '2025-12-01T00:00:00.000Z',
    cliffAt: '2026-12-01T00:00:00.000Z',
    beneficiary: 'team-gamma',
    amount: 150000,
  },
  {
    createdAt: '2026-02-01T00:00:00.000Z',
    cliffAt: '2026-08-01T00:00:00.000Z',
    beneficiary: 'ops-delta',
    amount: 75000,
  },
  {
    createdAt: '2026-03-01T00:00:00.000Z',
    cliffAt: '2026-06-01T00:00:00.000Z',
    beneficiary: 'seed-epsilon',
    amount: 90000,
  },
];

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildRollingAverage(points: MonthlyDisbursement[], windowSize: number): TimeSeriesPoint[] {
  return points.map((point, index) => {
    const windowStart = Math.max(0, index - windowSize + 1);
    const window = points.slice(windowStart, index + 1);
    const average = window.reduce((sum, current) => sum + current.disbursement, 0) / window.length;

    return {
      timestamp: point.timestamp,
      value: roundToTwo(average),
    };
  });
}

function buildCumulativeSeries(points: MonthlyDisbursement[]): TimeSeriesPoint[] {
  let total = 0;

  return points.map((point) => {
    total += point.disbursement;

    return {
      timestamp: point.timestamp,
      value: total,
    };
  });
}

function buildTreasurySeries(points: MonthlyTreasuryFlow[]) {
  let balance = STARTING_TREASURY_BALANCE;

  return points.map((point) => {
    const netFlow = point.deposits - point.withdrawals;
    balance += netFlow;

    return {
      balance: {
        timestamp: point.timestamp,
        value: balance,
      },
      deposits: {
        timestamp: point.timestamp,
        value: point.deposits,
      },
      withdrawals: {
        timestamp: point.timestamp,
        value: point.withdrawals,
      },
      netFlow: {
        timestamp: point.timestamp,
        value: netFlow,
      },
    };
  });
}

function buildCumulativeVestingSeries(grants: VestingGrant[]): TimeSeriesPoint[] {
  const sortedGrants = [...grants].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  let total = 0;

  return sortedGrants.map((grant) => {
    total += grant.amount;

    return {
      timestamp: grant.createdAt,
      value: total,
    };
  });
}

function daysUntilCliff(cliffAt: string, now: Date): number {
  const cliffDate = new Date(cliffAt);
  const diff = cliffDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getPayrollAnalytics(): PayrollAnalyticsResponse {
  const cumulativeDisbursements = buildCumulativeSeries(PAYROLL_MONTHLY_DISBURSEMENTS);
  const burnRateSeries = buildRollingAverage(PAYROLL_MONTHLY_DISBURSEMENTS, 3);
  const lastPoint = PAYROLL_MONTHLY_DISBURSEMENTS[PAYROLL_MONTHLY_DISBURSEMENTS.length - 1];

  return {
    generatedAt: new Date().toISOString(),
    granularity: 'month',
    currency: 'XLM',
    summary: {
      totalDisbursed: cumulativeDisbursements[cumulativeDisbursements.length - 1].value,
      activeStreams: lastPoint.activeStreams,
      burnRate: burnRateSeries[burnRateSeries.length - 1].value,
    },
    series: {
      disbursements: PAYROLL_MONTHLY_DISBURSEMENTS.map((point) => ({
        timestamp: point.timestamp,
        value: point.disbursement,
      })),
      cumulativeDisbursements,
      activeStreams: PAYROLL_MONTHLY_DISBURSEMENTS.map((point) => ({
        timestamp: point.timestamp,
        value: point.activeStreams,
      })),
      burnRate: burnRateSeries,
    },
  };
}

export function getTreasuryAnalytics(): TreasuryAnalyticsResponse {
  const series = buildTreasurySeries(TREASURY_MONTHLY_FLOW);
  const currentPoint = series[series.length - 1];

  return {
    generatedAt: new Date().toISOString(),
    granularity: 'month',
    currency: 'XLM',
    summary: {
      currentBalance: currentPoint.balance.value,
      totalDeposits: TREASURY_MONTHLY_FLOW.reduce((sum, point) => sum + point.deposits, 0),
      totalWithdrawals: TREASURY_MONTHLY_FLOW.reduce((sum, point) => sum + point.withdrawals, 0),
    },
    series: {
      balance: series.map((point) => point.balance),
      deposits: series.map((point) => point.deposits),
      withdrawals: series.map((point) => point.withdrawals),
      netFlow: series.map((point) => point.netFlow),
    },
  };
}

export function getVestingAnalytics(asOf: Date = new Date()): VestingAnalyticsResponse {
  const vestingSeries = buildCumulativeVestingSeries(VESTING_GRANTS);
  const upcomingCliffs = [...VESTING_GRANTS]
    .filter((grant) => new Date(grant.cliffAt).getTime() >= asOf.getTime())
    .sort((left, right) => new Date(left.cliffAt).getTime() - new Date(right.cliffAt).getTime())
    .map((grant) => ({
      beneficiary: grant.beneficiary,
      amount: grant.amount,
      timestamp: grant.cliffAt,
      daysUntilCliff: daysUntilCliff(grant.cliffAt, asOf),
    }));

  return {
    generatedAt: asOf.toISOString(),
    granularity: 'month',
    currency: 'XLM',
    summary: {
      totalVestingValue: vestingSeries[vestingSeries.length - 1].value,
      upcomingCliffs: upcomingCliffs.length,
      nextCliffAt: upcomingCliffs[0]?.timestamp ?? null,
    },
    series: {
      totalVestingValue: vestingSeries,
      cliffAmounts: upcomingCliffs.map((cliff) => ({
        timestamp: cliff.timestamp,
        value: cliff.amount,
      })),
    },
    upcomingCliffs,
  };
}
