/**
 * Unit tests for conversion utilities
 */

import {
  pixelsToRem,
  remToPixels,
  isValidBaseFontSize,
  roundRem,
  recalculateFontSize,
  generateRemScale,
  findClosestRem
} from '../utils/conversion';

describe('Conversion Utilities', () => {
  describe('pixelsToRem', () => {
    it('should convert pixels to rem correctly', () => {
      expect(pixelsToRem(16, 16)).toBe(1);
      expect(pixelsToRem(24, 16)).toBe(1.5);
      expect(pixelsToRem(12, 16)).toBe(0.75);
      expect(pixelsToRem(32, 16)).toBe(2);
    });

    it('should handle different base font sizes', () => {
      expect(pixelsToRem(20, 10)).toBe(2);
      expect(pixelsToRem(40, 20)).toBe(2);
      expect(pixelsToRem(17, 17)).toBe(1);
    });

    it('should throw error for invalid base font size', () => {
      expect(() => pixelsToRem(16, 0)).toThrow('Base font size must be greater than 0');
      expect(() => pixelsToRem(16, -5)).toThrow(
        'Base font size must be greater than 0'
      );
    });

    it('should handle decimal values', () => {
      expect(pixelsToRem(18, 16)).toBeCloseTo(1.125);
      expect(pixelsToRem(14, 16)).toBeCloseTo(0.875);
    });
  });

  describe('remToPixels', () => {
    it('should convert rem to pixels correctly', () => {
      expect(remToPixels(1, 16)).toBe(16);
      expect(remToPixels(1.5, 16)).toBe(24);
      expect(remToPixels(0.75, 16)).toBe(12);
      expect(remToPixels(2, 16)).toBe(32);
    });

    it('should handle different base font sizes', () => {
      expect(remToPixels(2, 10)).toBe(20);
      expect(remToPixels(1, 20)).toBe(20);
      expect(remToPixels(1.5, 12)).toBe(18);
    });

    it('should throw error for invalid base font size', () => {
      expect(() => remToPixels(1, 0)).toThrow('Base font size must be greater than 0');
      expect(() => remToPixels(1, -10)).toThrow(
        'Base font size must be greater than 0'
      );
    });
  });

  describe('isValidBaseFontSize', () => {
    it('should validate font sizes within default range', () => {
      expect(isValidBaseFontSize(16)).toBe(true);
      expect(isValidBaseFontSize(8)).toBe(true);
      expect(isValidBaseFontSize(32)).toBe(true);
      expect(isValidBaseFontSize(20)).toBe(true);
    });

    it('should reject font sizes outside default range', () => {
      expect(isValidBaseFontSize(7)).toBe(false);
      expect(isValidBaseFontSize(33)).toBe(false);
      expect(isValidBaseFontSize(100)).toBe(false);
      expect(isValidBaseFontSize(0)).toBe(false);
      expect(isValidBaseFontSize(-5)).toBe(false);
    });

    it('should handle custom range', () => {
      expect(isValidBaseFontSize(10, 10, 20)).toBe(true);
      expect(isValidBaseFontSize(5, 10, 20)).toBe(false);
      expect(isValidBaseFontSize(25, 10, 20)).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(isValidBaseFontSize(NaN)).toBe(false);
      expect(isValidBaseFontSize(Infinity)).toBe(false);
      expect(isValidBaseFontSize(-Infinity)).toBe(false);
    });
  });

  describe('roundRem', () => {
    it('should round to default 3 decimal places', () => {
      expect(roundRem(1.123456)).toBe(1.123);
      expect(roundRem(1.666666)).toBe(1.667);
      expect(roundRem(0.875432)).toBe(0.875);
    });

    it('should round to custom decimal places', () => {
      expect(roundRem(1.123456, 2)).toBe(1.12);
      expect(roundRem(1.123456, 1)).toBe(1.1);
      expect(roundRem(1.123456, 0)).toBe(1);
    });

    it('should handle whole numbers', () => {
      expect(roundRem(1, 3)).toBe(1);
      expect(roundRem(2, 3)).toBe(2);
    });
  });

  describe('recalculateFontSize', () => {
    it('should recalculate font size when base changes', () => {
      // 24px at 16px base = 1.5rem
      // 1.5rem at 20px base = 30px
      expect(recalculateFontSize(24, 16, 20)).toBe(30);
    });

    it('should maintain rem value across base changes', () => {
      const originalSize = 18;
      const oldBase = 16;
      const newBase = 20;

      const remValue = pixelsToRem(originalSize, oldBase);
      const newSize = recalculateFontSize(originalSize, oldBase, newBase);
      const newRemValue = pixelsToRem(newSize, newBase);

      expect(remValue).toBeCloseTo(newRemValue);
    });

    it('should handle edge cases', () => {
      expect(recalculateFontSize(16, 16, 16)).toBe(16);
      expect(recalculateFontSize(16, 16, 32)).toBe(32);
      expect(recalculateFontSize(32, 16, 8)).toBe(16);
    });
  });

  describe('generateRemScale', () => {
    it('should generate default rem scale', () => {
      const scale = generateRemScale(16);

      expect(scale).toHaveLength(10);
      expect(scale[0]).toEqual({ rem: 0.75, pixels: 12 });
      expect(scale[2]).toEqual({ rem: 1, pixels: 16 });
      expect(scale[5]).toEqual({ rem: 1.5, pixels: 24 });
    });

    it('should generate custom rem scale', () => {
      const customRems = [0.5, 1, 2, 4];
      const scale = generateRemScale(16, customRems);

      expect(scale).toHaveLength(4);
      expect(scale[0]).toEqual({ rem: 0.5, pixels: 8 });
      expect(scale[1]).toEqual({ rem: 1, pixels: 16 });
      expect(scale[2]).toEqual({ rem: 2, pixels: 32 });
      expect(scale[3]).toEqual({ rem: 4, pixels: 64 });
    });

    it('should work with different base font sizes', () => {
      const scale = generateRemScale(20, [1, 2]);

      expect(scale[0]).toEqual({ rem: 1, pixels: 20 });
      expect(scale[1]).toEqual({ rem: 2, pixels: 40 });
    });
  });

  describe('findClosestRem', () => {
    it('should find exact matches', () => {
      const remScale = [0.75, 1, 1.5, 2];
      expect(findClosestRem(16, 16, remScale)).toBe(1);
      expect(findClosestRem(24, 16, remScale)).toBe(1.5);
      expect(findClosestRem(32, 16, remScale)).toBe(2);
    });

    it('should find closest rem when no exact match', () => {
      const remScale = [0.75, 1, 1.5, 2];
      // 20px = 1.25rem, equidistant from 1 and 1.5, picks first (1)
      expect(findClosestRem(20, 16, remScale)).toBe(1);
      // 13px = 0.8125rem, closest is 0.75rem (distance 0.0625 vs 0.1875 to 1)
      expect(findClosestRem(13, 16, remScale)).toBe(0.75);
      // 22px = 1.375rem, closest is 1.5rem
      expect(findClosestRem(22, 16, remScale)).toBe(1.5);
    });

    it('should work with different base font sizes', () => {
      const remScale = [1, 2];
      expect(findClosestRem(20, 20, remScale)).toBe(1);
      expect(findClosestRem(35, 20, remScale)).toBe(2);
    });
  });
});
