declare module 'arabic-reshaper' {
  const ArabicReshaper: {
    convertArabic(input: string): string;
    convertArabicBack(input: string): string;
  };
  export default ArabicReshaper;
}

declare module 'bidi-js' {
  interface BidiEmbeddingLevels {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  }
  interface Bidi {
    getEmbeddingLevels(text: string, direction?: 'ltr' | 'rtl' | 'auto'): BidiEmbeddingLevels;
    getReorderSegments(text: string, embeddingLevels: BidiEmbeddingLevels, start?: number, end?: number): Array<[number, number]>;
    getReorderedIndices(text: string, embeddingLevels: BidiEmbeddingLevels, start?: number, end?: number): number[];
    getReorderedString(text: string, embeddingLevels: BidiEmbeddingLevels, start?: number, end?: number): string;
    getMirroredCharactersMap(text: string, embeddingLevels: BidiEmbeddingLevels, start?: number, end?: number): Map<number, string>;
    getMirroredCharacter(char: string): string | null;
  }
  export default function bidiFactory(): Bidi;
}
