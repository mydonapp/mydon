import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCurrency } from './useCurrency';

// Mock the usePrivacy composable
const mockUsePrivacy = vi.hoisted(() => ({
  isPrivate: { value: false },
}));

vi.mock('./usePrivacy', () => ({
  usePrivacy: () => mockUsePrivacy,
}));

describe('useCurrency', () => {
  beforeEach(() => {
    // Reset privacy mode before each test
    mockUsePrivacy.isPrivate.value = false;
  });

  describe('formatCurrency', () => {
    it('should format CHF currency correctly', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(1234.56, 'CHF');

      // Swiss German locale formatting
      expect(result).toMatch(/CHF/);
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('56');
    });

    it('should format EUR currency correctly', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(1000.0, 'EUR');

      expect(result).toMatch(/€|EUR/);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should format USD currency correctly', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(500.75, 'USD');

      expect(result).toMatch(/\$|USD/);
      expect(result).toContain('500');
      expect(result).toContain('75');
    });

    it('should handle zero values', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(0, 'CHF');

      expect(result).toMatch(/CHF/);
      expect(result).toMatch(/0/);
    });

    it('should handle negative values', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(-100.5, 'CHF');

      expect(result).toMatch(/CHF/);
      expect(result).toContain('100');
      expect(result).toContain('50');
      // Should contain minus sign or negative formatting
      expect(result).toMatch(/-|−/);
    });

    it('should handle large numbers', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(1000000.99, 'CHF');

      expect(result).toMatch(/CHF/);
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('99');
    });

    it('should default to CHF for unknown currency', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(100, 'UNKNOWN');

      expect(result).toMatch(/CHF/);
      expect(result).toContain('100');
    });

    it('should handle decimal precision correctly', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(99.999, 'CHF');

      // Should round to 2 decimal places
      expect(result).toMatch(/CHF/);
      expect(result).toContain('100'); // Rounded up
    });

    it('should return *** when privacy mode is enabled', () => {
      mockUsePrivacy.isPrivate.value = true;

      const { formatCurrency } = useCurrency();

      const result = formatCurrency(1234.56, 'CHF');

      expect(result).toBe('***');
    });

    it('should handle privacy mode for different currencies', () => {
      mockUsePrivacy.isPrivate.value = true;

      const { formatCurrency } = useCurrency();

      expect(formatCurrency(100, 'CHF')).toBe('***');
      expect(formatCurrency(200, 'EUR')).toBe('***');
      expect(formatCurrency(300, 'USD')).toBe('***');
      expect(formatCurrency(400, 'GBP')).toBe('***');
    });

    it('should handle privacy mode for negative and zero values', () => {
      mockUsePrivacy.isPrivate.value = true;

      const { formatCurrency } = useCurrency();

      expect(formatCurrency(0, 'CHF')).toBe('***');
      expect(formatCurrency(-100, 'CHF')).toBe('***');
    });

    it('should format KRW currency correctly', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(1000, 'KRW');

      expect(result).toMatch(/₩|KRW/);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should format GBP currency correctly', () => {
      const { formatCurrency } = useCurrency();

      const result = formatCurrency(750.25, 'GBP');

      expect(result).toMatch(/£|GBP/);
      expect(result).toContain('750');
      expect(result).toContain('25');
    });

    it('should handle edge case numbers', () => {
      const { formatCurrency } = useCurrency();

      // Very small positive number
      expect(formatCurrency(0.01, 'CHF')).toMatch(/CHF/);

      // Very small negative number
      expect(formatCurrency(-0.01, 'CHF')).toMatch(/CHF/);

      // Number with many decimal places
      expect(formatCurrency(123.456789, 'CHF')).toMatch(/CHF/);
    });
  });
});
