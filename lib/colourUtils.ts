/**
 * Utility functions for colour manipulation and matching.
 */

export type RGB = { r: number; g: number; b: number };

/** Convert a hex string (#RRGGBB or #RGB) to RGB */
export function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

/** Convert RGB to hex string */
export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Euclidean distance between two colours in RGB space (0–441) */
export function colourDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2)
  );
}

/**
 * Find closest colour from a list of hex values to a target hex.
 * Returns the index of the closest match.
 */
export function findClosestColour(targetHex: string, candidateHexes: string[]): number {
  const target = hexToRgb(targetHex);
  if (!target) return 0;

  let minDist = Infinity;
  let minIdx = 0;

  for (let i = 0; i < candidateHexes.length; i++) {
    const rgb = hexToRgb(candidateHexes[i]);
    if (!rgb) continue;
    const dist = colourDistance(target, rgb);
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
  }
  return minIdx;
}

/** Return a contrasting text colour (black or white) for a given background hex */
export function contrastTextColour(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#000';
  // Perceived luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/** Validate a hex colour string */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/** Normalise hex to always be #RRGGBB */
export function normaliseHex(hex: string): string {
  const clean = hex.trim().startsWith('#') ? hex.trim() : '#' + hex.trim();
  const rgb = hexToRgb(clean);
  if (!rgb) return clean;
  return rgbToHex(rgb);
}
