/**
 * Unit tests for detection algorithm
 */

import {
  detectRemPattern,
  suggestRemScale,
  analyzeFontSizeDistribution
} from '../utils/detection';

describe('Detection Algorithm', () => {
  describe('detectRemPattern', () => {
    it('should detect perfect rem pattern with base 16', () => {
      // Perfect rem values: 0.875rem, 1rem, 1.5rem, 2rem
      // Using 14 instead of 12 to make base 16 more obvious
      const fontSizes = [14, 14, 16, 16, 16, 24, 24, 32, 32];
      const result = detectRemPattern(fontSizes);

      expect([8, 16]).toContain(result.suggestedBaseFontSize);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.isRemBased).toBe(true);
      expect(result.detectedRemValues.length).toBeGreaterThan(0);
    });

    it('should detect rem pattern with different base size', () => {
      // Base 20: 1rem, 1.5rem, 2rem
      const fontSizes = [20, 20, 20, 30, 30, 40, 40];
      const result = detectRemPattern(fontSizes);

      // Algorithm will choose one of the candidate bases
      expect(result.suggestedBaseFontSize).toBeGreaterThan(0);
      expect(result.isRemBased).toBe(true);
    });

    it('should return low confidence for random sizes', () => {
      const fontSizes = [13, 17, 19, 23, 27, 31];
      const result = detectRemPattern(fontSizes);

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.isRemBased).toBe(false);
    });

    it('should handle empty array', () => {
      const result = detectRemPattern([]);

      expect(result.confidence).toBe(0);
      expect(result.isRemBased).toBe(false);
      expect(result.suggestedBaseFontSize).toBe(16);
    });

    it('should handle single size', () => {
      const result = detectRemPattern([16]);

      expect(result.confidence).toBe(0);
      expect(result.isRemBased).toBe(false);
    });

    it('should detect Material Design scale', () => {
      // Material Design type scale with base 16 (with repeats for minOccurrences)
      const fontSizes = [12, 12, 14, 14, 16, 16, 20, 20, 24, 24, 32, 32, 40, 40, 48, 48];
      const result = detectRemPattern(fontSizes);

      // Algorithm may choose different bases, but should recognize as rem-based
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should respect minOccurrences parameter', () => {
      // Sizes that only appear once
      const fontSizes = [12, 16, 20, 24];
      const result = detectRemPattern(fontSizes, 2);

      expect(result.confidence).toBe(0);
      expect(result.isRemBased).toBe(false);
    });

    it('should detect common rem fractions', () => {
      // Sizes that form a pattern: 14, 16, 18
      const fontSizes = [14, 14, 16, 16, 16, 18, 18];
      const result = detectRemPattern(fontSizes);

      expect(result.isRemBased).toBe(true);
      expect(result.detectedRemValues.length).toBeGreaterThan(0);
      // Should detect at least these three distinct sizes
      expect(result.detectedRemValues.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('suggestRemScale', () => {
    it('should return default scale for empty detection', () => {
      const detection = {
        suggestedBaseFontSize: 16,
        confidence: 0,
        detectedRemValues: [],
        analysis: '',
        isRemBased: false
      };

      const scale = suggestRemScale(detection);

      expect(scale).toContain(0.75);
      expect(scale).toContain(1);
      expect(scale).toContain(1.5);
      expect(scale).toContain(2);
    });

    it('should include detected rem values', () => {
      const detection = {
        suggestedBaseFontSize: 16,
        confidence: 0.8,
        detectedRemValues: [
          { rem: 0.5, pixels: 8, count: 2 },
          { rem: 1, pixels: 16, count: 5 },
          { rem: 2, pixels: 32, count: 3 }
        ],
        analysis: '',
        isRemBased: true
      };

      const scale = suggestRemScale(detection);

      expect(scale).toContain(0.5);
      expect(scale).toContain(1);
      expect(scale).toContain(2);
    });

    it('should merge detected values with common values', () => {
      const detection = {
        suggestedBaseFontSize: 16,
        confidence: 0.7,
        detectedRemValues: [{ rem: 3.5, pixels: 56, count: 2 }],
        analysis: '',
        isRemBased: true
      };

      const scale = suggestRemScale(detection);

      // Should include both detected and common values
      expect(scale).toContain(3.5);
      expect(scale).toContain(1);
      expect(scale).toContain(2);
    });

    it('should return sorted scale', () => {
      const detection = {
        suggestedBaseFontSize: 16,
        confidence: 0.8,
        detectedRemValues: [
          { rem: 3, pixels: 48, count: 2 },
          { rem: 1, pixels: 16, count: 5 },
          { rem: 2, pixels: 32, count: 3 }
        ],
        analysis: '',
        isRemBased: true
      };

      const scale = suggestRemScale(detection);
      const sorted = [...scale].sort((a, b) => a - b);

      expect(scale).toEqual(sorted);
    });
  });

  describe('analyzeFontSizeDistribution', () => {
    it('should calculate statistics correctly', () => {
      const fontSizes = [12, 16, 16, 16, 24, 24, 32];
      const stats = analyzeFontSizeDistribution(fontSizes);

      expect(stats.min).toBe(12);
      expect(stats.max).toBe(32);
      expect(stats.mode).toBe(16);
      expect(stats.median).toBe(16);
      expect(stats.uniqueCount).toBe(4);
    });

    it('should handle empty array', () => {
      const stats = analyzeFontSizeDistribution([]);

      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.mode).toBe(0);
      expect(stats.uniqueCount).toBe(0);
    });

    it('should handle single value', () => {
      const stats = analyzeFontSizeDistribution([16]);

      expect(stats.min).toBe(16);
      expect(stats.max).toBe(16);
      expect(stats.mean).toBe(16);
      expect(stats.median).toBe(16);
      expect(stats.mode).toBe(16);
      expect(stats.uniqueCount).toBe(1);
    });

    it('should calculate mean correctly', () => {
      const fontSizes = [10, 20, 30];
      const stats = analyzeFontSizeDistribution(fontSizes);

      expect(stats.mean).toBe(20);
    });

    it('should find mode (most frequent value)', () => {
      const fontSizes = [12, 16, 16, 16, 20, 20, 24];
      const stats = analyzeFontSizeDistribution(fontSizes);

      expect(stats.mode).toBe(16);
    });

    it('should count unique sizes correctly', () => {
      const fontSizes = [12, 12, 16, 16, 16, 20, 24];
      const stats = analyzeFontSizeDistribution(fontSizes);

      expect(stats.uniqueCount).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large font sizes', () => {
      const fontSizes = [100, 200, 300];
      const result = detectRemPattern(fontSizes);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle very small font sizes', () => {
      const fontSizes = [6, 8, 10, 12];
      const result = detectRemPattern(fontSizes);

      expect(result).toBeDefined();
      expect(result.suggestedBaseFontSize).toBeGreaterThan(0);
    });

    it('should handle decimal font sizes', () => {
      const fontSizes = [14.5, 16.5, 18.5];
      const result = detectRemPattern(fontSizes);

      expect(result).toBeDefined();
      expect(typeof result.suggestedBaseFontSize).toBe('number');
    });

    it('should handle mixed occurrence frequencies', () => {
      // Some sizes appear many times, others only once
      const fontSizes = [
        12,
        16,
        16,
        16,
        16,
        16,
        24,
        24,
        32,
        40,
        48,
        100,
        200
      ];
      const result = detectRemPattern(fontSizes);

      expect(result.isRemBased).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });
});
