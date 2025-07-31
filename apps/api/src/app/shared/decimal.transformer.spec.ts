import { ColumnDecimalTransformer } from './decimal.transformer';

describe('ColumnDecimalTransformer', () => {
  let transformer: ColumnDecimalTransformer;

  beforeEach(() => {
    transformer = new ColumnDecimalTransformer();
  });

  describe('to method', () => {
    it('should return the same number when converting to database', () => {
      expect(transformer.to(123.45)).toBe(123.45);
      expect(transformer.to(0)).toBe(0);
      expect(transformer.to(-100.5)).toBe(-100.5);
    });

    it('should handle large numbers correctly', () => {
      const largeNumber = 999999.99;
      expect(transformer.to(largeNumber)).toBe(largeNumber);
    });

    it('should handle very small numbers correctly', () => {
      const smallNumber = 0.01;
      expect(transformer.to(smallNumber)).toBe(smallNumber);
    });
  });

  describe('from method', () => {
    it('should convert valid string numbers to numbers', () => {
      expect(transformer.from('123.45')).toBe(123.45);
      expect(transformer.from('0')).toBe(0);
      expect(transformer.from('-100.5')).toBe(-100.5);
      expect(transformer.from('999999.99')).toBe(999999.99);
    });

    it('should handle integer strings', () => {
      expect(transformer.from('100')).toBe(100);
      expect(transformer.from('0')).toBe(0);
      expect(transformer.from('-50')).toBe(-50);
    });

    it('should handle decimal strings', () => {
      expect(transformer.from('123.456')).toBe(123.456);
      expect(transformer.from('0.01')).toBe(0.01);
      expect(transformer.from('-0.5')).toBe(-0.5);
    });

    it('should return 0 for null values', () => {
      expect(transformer.from(null as unknown as string)).toBe(0);
    });

    it('should return 0 for undefined values', () => {
      expect(transformer.from(undefined as unknown as string)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(transformer.from('')).toBe(0);
    });

    it('should return 0 for invalid string values', () => {
      expect(transformer.from('invalid')).toBe(0);
      expect(transformer.from('abc123')).toBe(0);
      expect(transformer.from('123abc')).toBe(123); // parseFloat stops at first invalid character
      expect(transformer.from('not-a-number')).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(transformer.from('Infinity')).toBe(Infinity);
      expect(transformer.from('-Infinity')).toBe(-Infinity);
      expect(transformer.from('NaN')).toBe(0); // parseFloat('NaN') returns NaN, which we convert to 0
    });

    it('should handle strings with leading/trailing whitespace', () => {
      expect(transformer.from('  123.45  ')).toBe(123.45);
      expect(transformer.from('\t100\n')).toBe(100);
      expect(transformer.from(' -50.5 ')).toBe(-50.5);
    });

    it('should handle scientific notation', () => {
      expect(transformer.from('1e2')).toBe(100);
      expect(transformer.from('1.5e3')).toBe(1500);
      expect(transformer.from('2e-2')).toBe(0.02);
    });

    it('should handle very large and very small number strings', () => {
      expect(transformer.from('999999999999.99')).toBe(999999999999.99);
      expect(transformer.from('0.000001')).toBe(0.000001);
    });

    it('should preserve precision for financial calculations', () => {
      // Test common financial values
      expect(transformer.from('19.99')).toBe(19.99);
      expect(transformer.from('1000.00')).toBe(1000);
      expect(transformer.from('0.01')).toBe(0.01);
      expect(transformer.from('999.99')).toBe(999.99);
    });
  });

  describe('round-trip conversion', () => {
    it('should handle round-trip conversions correctly', () => {
      const originalNumber = 123.45;
      const stringValue = originalNumber.toString();
      const convertedBack = transformer.from(stringValue);

      expect(convertedBack).toBe(originalNumber);
    });

    it('should handle multiple round-trip conversions', () => {
      const testValues = [0, 100, -50.5, 999.99, 0.01, 1000000];

      testValues.forEach((value) => {
        const stringValue = value.toString();
        const convertedBack = transformer.from(stringValue);
        expect(convertedBack).toBe(value);
      });
    });
  });
});
