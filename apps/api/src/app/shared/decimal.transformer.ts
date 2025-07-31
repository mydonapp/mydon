export class ColumnDecimalTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    // Handle null, undefined, or empty string values
    if (data === null || data === undefined || data === '') {
      return 0;
    }
    const parsed = parseFloat(data);
    // Return 0 if parseFloat returns NaN
    return isNaN(parsed) ? 0 : parsed;
  }
}
