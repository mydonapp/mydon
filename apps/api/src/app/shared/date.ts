/**
 * Helpers for accounting dates — calendar dates ('YYYY-MM-DD') with no time and no zone.
 * Stored in Postgres `date` columns (TypeORM returns them as strings), so they never get
 * reinterpreted across timezones the way a `timestamptz` instant would.
 */

/** Normalise a Date (by its UTC calendar day) or an ISO/date string to 'YYYY-MM-DD'. */
export function toDateString(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

/** Today's calendar date (UTC) as 'YYYY-MM-DD'. */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Build a 'YYYY-MM-DD' string from numeric parts (month is 1–12). Avoids JS Date zone shifts. */
export function ymdToDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface FiscalYearPeriod {
  /** First day of the fiscal year, e.g. '2025-01-01'. */
  start: string;
  /** First day of the *next* fiscal year (exclusive upper bound), e.g. '2026-01-01'. */
  endExclusive: string;
  /** Last day of the fiscal year, e.g. '2025-12-31'. */
  end: string;
}

/** Calendar bounds of the fiscal year that begins in `startYear` at `startMonth` (1–12). */
export function fiscalYearPeriod(startYear: number, startMonth: number): FiscalYearPeriod {
  const start = ymdToDateString(startYear, startMonth, 1);
  const endExclusive = ymdToDateString(startYear + 1, startMonth, 1);
  // One day before the exclusive end; Date.UTC keeps the arithmetic in UTC so the day can't drift.
  const end = new Date(Date.UTC(startYear + 1, startMonth - 1, 1) - 86_400_000).toISOString().slice(0, 10);
  return { start, endExclusive, end };
}
