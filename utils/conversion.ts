/**
 * Conversion utilities for rem and pixel calculations
 */

/**
 * Converts pixels to rem based on a base font size
 * @param pixels - The pixel value to convert
 * @param baseFontSize - The base font size in pixels
 * @returns The rem value
 */
export function pixelsToRem(pixels: number, baseFontSize: number): number {
  if (baseFontSize <= 0) {
    throw new Error('Base font size must be greater than 0');
  }
  return pixels / baseFontSize;
}

/**
 * Converts rem to pixels based on a base font size
 * @param rem - The rem value to convert
 * @param baseFontSize - The base font size in pixels
 * @returns The pixel value
 */
export function remToPixels(rem: number, baseFontSize: number): number {
  if (baseFontSize <= 0) {
    throw new Error('Base font size must be greater than 0');
  }
  return rem * baseFontSize;
}

/**
 * Validates that a base font size is within acceptable bounds
 * @param size - The font size to validate
 * @param minSize - Minimum allowed size (default: 8)
 * @param maxSize - Maximum allowed size (default: 32)
 * @returns True if valid, false otherwise
 */
export function isValidBaseFontSize(
  size: number,
  minSize: number = 8,
  maxSize: number = 32
): boolean {
  return (
    typeof size === 'number' &&
    !isNaN(size) &&
    isFinite(size) &&
    size >= minSize &&
    size <= maxSize
  );
}

/**
 * Rounds a rem value to a specified number of decimal places
 * @param rem - The rem value to round
 * @param decimals - Number of decimal places (default: 3)
 * @returns The rounded rem value
 */
export function roundRem(rem: number, decimals: number = 3): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(rem * multiplier) / multiplier;
}

/**
 * Calculates the new font size when changing base font size
 * @param currentSize - Current font size in pixels
 * @param oldBase - Old base font size
 * @param newBase - New base font size
 * @returns The new font size in pixels
 */
export function recalculateFontSize(
  currentSize: number,
  oldBase: number,
  newBase: number
): number {
  const remValue = pixelsToRem(currentSize, oldBase);
  return remToPixels(remValue, newBase);
}

/**
 * Generates a list of common rem values
 * @param baseFontSize - The base font size
 * @param remValues - Array of rem multipliers (e.g., [0.75, 1, 1.5, 2])
 * @returns Array of {rem, pixels} objects
 */
export function generateRemScale(
  baseFontSize: number,
  remValues: number[] = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3, 4]
): Array<{ rem: number; pixels: number }> {
  return remValues.map(rem => ({
    rem,
    pixels: remToPixels(rem, baseFontSize)
  }));
}

/**
 * Finds the closest rem value from a scale
 * @param pixels - The pixel value to find the closest rem for
 * @param baseFontSize - The base font size
 * @param remScale - Array of rem values to check against
 * @returns The closest rem value
 */
export function findClosestRem(
  pixels: number,
  baseFontSize: number,
  remScale: number[]
): number {
  if (!remScale || remScale.length === 0) {
    // If no scale provided, return the direct conversion
    return pixelsToRem(pixels, baseFontSize);
  }

  const targetRem = pixelsToRem(pixels, baseFontSize);

  return remScale.reduce((closest, current) => {
    const currentDiff = Math.abs(current - targetRem);
    const closestDiff = Math.abs(closest - targetRem);
    return currentDiff < closestDiff ? current : closest;
  });
}
