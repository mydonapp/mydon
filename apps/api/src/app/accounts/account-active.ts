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
  a: { activeFrom: Date | null; activeUntil: Date | null },
  asOf: Date = new Date(),
): boolean {
  const from = a.activeFrom ? new Date(a.activeFrom) : null;
  const until = a.activeUntil ? new Date(a.activeUntil) : null;
  return (from == null || from <= asOf) && (until == null || until > asOf);
}
