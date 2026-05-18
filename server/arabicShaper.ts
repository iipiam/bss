import ArabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabic(s: string): boolean {
  return ARABIC_RE.test(s || '');
}

/**
 * Shape an Arabic / mixed string into the correct presentation forms and
 * apply the Unicode Bidirectional Algorithm so that the visual order is
 * correct when handed to jsPDF (which does NOT itself reorder bidi text).
 */
export function prepareArabic(input: string): string {
  if (!input) return '';
  const reshaped = ArabicReshaper.convertArabic(input);
  const paragraph = bidi.getEmbeddingLevels(reshaped, 'rtl');
  const reordered = bidi.getReorderedString(reshaped, paragraph);
  return reordered;
}

// Backwards-compatible exports (older code referenced these names)
export const shapeArabic = prepareArabic;
export const visualizeRtl = prepareArabic;
