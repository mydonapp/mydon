// Liabilities and expense accounts invert the sign: positive = more owed/spent = bad (red).
export function balanceColor(accountType: string, value: number): string {
  const t = accountType.toLowerCase();
  const inverted = t === 'liabilities' || t === 'expense' || t === 'expenses';
  return (inverted ? value < 0 : value >= 0) ? 'text-success' : 'text-error';
}
