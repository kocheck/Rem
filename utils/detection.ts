/**
 * Smart detection algorithm for analyzing font size patterns
 */

import { pixelsToRem, roundRem } from './conversion';

/**
 * Detection result interface
 */
export interface DetectionResult {
  suggestedBaseFontSize: number;
  confidence: number; // 0-1 scale
  detectedRemValues: Array<{ rem: number; pixels: number; count: number }>;
  analysis: string;
  isRemBased: boolean;
}

/**
 * Analyzes font sizes to detect if they follow a rem pattern
 * @param fontSizes - Array of font sizes in pixels
 * @param minOccurrences - Minimum occurrences for a size to be considered (default: 2)
 * @returns Detection result
 */
export function detectRemPattern(
  fontSizes: number[],
  minOccurrences: number = 2
): DetectionResult {
  if (fontSizes.length === 0) {
    return {
      suggestedBaseFontSize: 16,
      confidence: 0,
      detectedRemValues: [],
      analysis: 'No font sizes found to analyze',
      isRemBased: false
    };
  }

  // Count occurrences of each font size
  const sizeFrequency = new Map<number, number>();
  for (const size of fontSizes) {
    sizeFrequency.set(size, (sizeFrequency.get(size) || 0) + 1);
  }

  // Filter sizes that appear at least minOccurrences times
  const significantSizes = Array.from(sizeFrequency.entries())
    .filter(([_, count]) => count >= minOccurrences)
    .map(([size]) => size)
    .sort((a, b) => a - b);

  if (significantSizes.length < 2) {
    return {
      suggestedBaseFontSize: significantSizes[0] || 16,
      confidence: 0,
      detectedRemValues: [],
      analysis: 'Not enough diverse font sizes to detect a pattern',
      isRemBased: false
    };
  }

  // Try different base font sizes (common values between 8 and 32)
  const candidateBases = [8, 10, 12, 14, 15, 16, 17, 18, 20, 24];
  let bestResult: {
    base: number;
    score: number;
    remValues: Array<{ rem: number; pixels: number; count: number }>;
  } | null = null;

  for (const candidateBase of candidateBases) {
    const result = evaluateBaseCandidate(
      candidateBase,
      significantSizes,
      sizeFrequency
    );

    if (!bestResult || result.score > bestResult.score) {
      bestResult = result;
    }
  }

  // Also try the most common size as a base (likely 1rem)
  const mostCommonSize = Array.from(sizeFrequency.entries()).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  const mostCommonResult = evaluateBaseCandidate(
    mostCommonSize,
    significantSizes,
    sizeFrequency
  );

  if (mostCommonResult.score > (bestResult?.score || 0)) {
    bestResult = mostCommonResult;
  }

  if (!bestResult) {
    return {
      suggestedBaseFontSize: 16,
      confidence: 0,
      detectedRemValues: [],
      analysis: 'Could not detect a rem pattern',
      isRemBased: false
    };
  }

  // Calculate confidence based on score
  const confidence = Math.min(bestResult.score, 1);
  const isRemBased = confidence >= 0.6;

  // Generate analysis text
  const analysis = generateAnalysis(
    bestResult.base,
    bestResult.remValues,
    confidence,
    isRemBased
  );

  return {
    suggestedBaseFontSize: bestResult.base,
    confidence,
    detectedRemValues: bestResult.remValues,
    analysis,
    isRemBased
  };
}

/**
 * Evaluates how well a candidate base font size fits the observed sizes
 * @param candidateBase - The candidate base font size
 * @param sizes - Array of observed font sizes
 * @param sizeFrequency - Map of size to occurrence count
 * @returns Evaluation result
 */
function evaluateBaseCandidate(
  candidateBase: number,
  sizes: number[],
  sizeFrequency: Map<number, number>
): {
  base: number;
  score: number;
  remValues: Array<{ rem: number; pixels: number; count: number }>;
} {
  const remValues: Array<{ rem: number; pixels: number; count: number }> = [];
  let matchCount = 0;
  let totalOccurrences = 0;

  // Common rem values to check for
  const commonRemValues = [
    0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 5, 6
  ];

  for (const size of sizes) {
    const remValue = pixelsToRem(size, candidateBase);
    const roundedRem = roundRem(remValue, 3);

    // Check if the rem value is close to a common value
    const isCommonRem = commonRemValues.some(
      common => Math.abs(common - roundedRem) < 0.05
    );

    // Check if the rem value is "clean" (close to a simple fraction)
    const isCleanRem = isCleanRemValue(roundedRem);

    if (isCommonRem || isCleanRem) {
      matchCount++;
      totalOccurrences += sizeFrequency.get(size) || 0;
      remValues.push({
        rem: roundedRem,
        pixels: size,
        count: sizeFrequency.get(size) || 0
      });
    }
  }

  // Calculate score based on:
  // 1. Percentage of sizes that match rem pattern (40% weight)
  // 2. Percentage of total occurrences that match (40% weight)
  // 3. Number of detected rem values (20% weight, capped at 10)
  const matchPercentage = sizes.length > 0 ? matchCount / sizes.length : 0;
  const totalSizes = Array.from(sizeFrequency.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  const occurrencePercentage =
    totalSizes > 0 ? totalOccurrences / totalSizes : 0;
  const diversityScore = Math.min(remValues.length / 10, 1);

  const score =
    matchPercentage * 0.4 + occurrencePercentage * 0.4 + diversityScore * 0.2;

  return {
    base: candidateBase,
    score,
    remValues: remValues.sort((a, b) => a.rem - b.rem)
  };
}

/**
 * Checks if a rem value is "clean" (close to a simple fraction)
 * @param rem - The rem value to check
 * @returns True if the value is clean
 */
function isCleanRemValue(rem: number): boolean {
  // Check if close to quarters (0.25, 0.5, 0.75, etc.)
  const quarters = Math.round(rem * 4) / 4;
  if (Math.abs(rem - quarters) < 0.05) return true;

  // Check if close to thirds (0.333, 0.666, etc.)
  const thirds = Math.round(rem * 3) / 3;
  if (Math.abs(rem - thirds) < 0.05) return true;

  // Check if close to eighths (0.125, 0.375, etc.)
  const eighths = Math.round(rem * 8) / 8;
  if (Math.abs(rem - eighths) < 0.05) return true;

  // Check if close to whole number
  const whole = Math.round(rem);
  if (Math.abs(rem - whole) < 0.05) return true;

  return false;
}

/**
 * Generates analysis text based on detection results
 * @param base - The detected base font size
 * @param remValues - Detected rem values
 * @param confidence - Confidence score
 * @param isRemBased - Whether the design appears to be rem-based
 * @returns Analysis text
 */
function generateAnalysis(
  base: number,
  remValues: Array<{ rem: number; pixels: number; count: number }>,
  confidence: number,
  isRemBased: boolean
): string {
  if (!isRemBased) {
    return `Low confidence (${Math.round(confidence * 100)}%). The font sizes don't appear to follow a clear rem pattern. You can still use the suggested base size of ${base}px, but results may vary.`;
  }

  const remList = remValues
    .slice(0, 8)
    .map(rv => `${rv.rem}rem (${rv.pixels}px)`)
    .join(', ');

  const moreCount = remValues.length > 8 ? remValues.length - 8 : 0;
  const moreText = moreCount > 0 ? ` and ${moreCount} more` : '';

  return `High confidence (${Math.round(confidence * 100)}%). Detected a rem-based system with base size ${base}px. Found sizes that appear to be: ${remList}${moreText}.`;
}

/**
 * Suggests optimal rem scale based on detected values
 * @param detectionResult - The detection result
 * @returns Array of suggested rem values
 */
export function suggestRemScale(detectionResult: DetectionResult): number[] {
  if (detectionResult.detectedRemValues.length === 0) {
    // Return default scale
    return [0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3, 4];
  }

  // Extract unique rem values and sort
  const detectedRems = detectionResult.detectedRemValues
    .map(rv => rv.rem)
    .sort((a, b) => a - b);

  // Add some common values that might be missing
  const commonValues = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3, 4];
  const suggested = new Set([...detectedRems, ...commonValues]);

  return Array.from(suggested).sort((a, b) => a - b);
}

/**
 * Analyzes font size distribution
 * @param fontSizes - Array of font sizes
 * @returns Distribution statistics
 */
export function analyzeFontSizeDistribution(fontSizes: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number;
  uniqueCount: number;
} {
  if (fontSizes.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      mode: 0,
      uniqueCount: 0
    };
  }

  const sorted = [...fontSizes].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  // Find mode
  const frequency = new Map<number, number>();
  for (const size of fontSizes) {
    frequency.set(size, (frequency.get(size) || 0) + 1);
  }
  const mode = Array.from(frequency.entries()).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  const uniqueCount = frequency.size;

  return { min, max, mean, median, mode, uniqueCount };
}
