import { toDateString, todayDateString } from '../shared/date';

/**
 * Determines whether an account is active on a given date.
 *
 * Both bounds are exclusive on the upper side:
 * - activeFrom = null → active since creation
 * - activeUntil = null → no scheduled deactivation
 * - active if activeFrom <= asOf < activeUntil
 *
 * Use the transaction's date (not "today") when validating that an account
 * can be posted against — booking a December invoice in January must still
 * find accounts that were active in December.
 */
export function isAccountActive(
  a: { activeFrom: string | null; activeUntil: string | null },
  asOf: string | Date = todayDateString(),
): boolean {
  // Calendar-date comparison: 'YYYY-MM-DD' strings sort chronologically, so plain string compare works.
  const on = toDateString(asOf);
  const from = a.activeFrom ? toDateString(a.activeFrom) : null;
  const until = a.activeUntil ? toDateString(a.activeUntil) : null;
  return (from == null || from <= on) && (until == null || until > on);
}
