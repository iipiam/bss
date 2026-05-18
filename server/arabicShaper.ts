// Minimal Arabic shaper: maps Arabic letters in a string to their correct
// presentation forms (FE70–FEFF Unicode block) based on joining context,
// then reverses runs of Arabic for visual RTL rendering on engines that do
// not perform their own bidi/shaping (such as jsPDF).
//
// This is intentionally compact. It covers the main Arabic block and the
// LAM-ALEF ligatures used in Arabic text. It does not handle Persian-only
// letters, kashida insertion, or complex bidi mirroring; for invoice/contract
// labels and short paragraphs it produces readable, connected glyphs.

type Form = { iso: number; fin?: number; ini?: number; med?: number; type: "R" | "D" | "U" | "T" };

// joining: R = right-joining (only iso + final), D = dual, U = non-joining, T = transparent (diacritics)
const TABLE: Record<number, Form> = {
  0x0621: { iso: 0xFE80, type: "U" }, // HAMZA
  0x0622: { iso: 0xFE81, fin: 0xFE82, type: "R" }, // ALEF MADDA
  0x0623: { iso: 0xFE83, fin: 0xFE84, type: "R" }, // ALEF HAMZA ABOVE
  0x0624: { iso: 0xFE85, fin: 0xFE86, type: "R" }, // WAW HAMZA
  0x0625: { iso: 0xFE87, fin: 0xFE88, type: "R" }, // ALEF HAMZA BELOW
  0x0626: { iso: 0xFE89, fin: 0xFE8A, ini: 0xFE8B, med: 0xFE8C, type: "D" }, // YEH HAMZA
  0x0627: { iso: 0xFE8D, fin: 0xFE8E, type: "R" }, // ALEF
  0x0628: { iso: 0xFE8F, fin: 0xFE90, ini: 0xFE91, med: 0xFE92, type: "D" }, // BEH
  0x0629: { iso: 0xFE93, fin: 0xFE94, type: "R" }, // TEH MARBUTA
  0x062A: { iso: 0xFE95, fin: 0xFE96, ini: 0xFE97, med: 0xFE98, type: "D" }, // TEH
  0x062B: { iso: 0xFE99, fin: 0xFE9A, ini: 0xFE9B, med: 0xFE9C, type: "D" }, // THEH
  0x062C: { iso: 0xFE9D, fin: 0xFE9E, ini: 0xFE9F, med: 0xFEA0, type: "D" }, // JEEM
  0x062D: { iso: 0xFEA1, fin: 0xFEA2, ini: 0xFEA3, med: 0xFEA4, type: "D" }, // HAH
  0x062E: { iso: 0xFEA5, fin: 0xFEA6, ini: 0xFEA7, med: 0xFEA8, type: "D" }, // KHAH
  0x062F: { iso: 0xFEA9, fin: 0xFEAA, type: "R" }, // DAL
  0x0630: { iso: 0xFEAB, fin: 0xFEAC, type: "R" }, // THAL
  0x0631: { iso: 0xFEAD, fin: 0xFEAE, type: "R" }, // REH
  0x0632: { iso: 0xFEAF, fin: 0xFEB0, type: "R" }, // ZAIN
  0x0633: { iso: 0xFEB1, fin: 0xFEB2, ini: 0xFEB3, med: 0xFEB4, type: "D" }, // SEEN
  0x0634: { iso: 0xFEB5, fin: 0xFEB6, ini: 0xFEB7, med: 0xFEB8, type: "D" }, // SHEEN
  0x0635: { iso: 0xFEB9, fin: 0xFEBA, ini: 0xFEBB, med: 0xFEBC, type: "D" }, // SAD
  0x0636: { iso: 0xFEBD, fin: 0xFEBE, ini: 0xFEBF, med: 0xFEC0, type: "D" }, // DAD
  0x0637: { iso: 0xFEC1, fin: 0xFEC2, ini: 0xFEC3, med: 0xFEC4, type: "D" }, // TAH
  0x0638: { iso: 0xFEC5, fin: 0xFEC6, ini: 0xFEC7, med: 0xFEC8, type: "D" }, // ZAH
  0x0639: { iso: 0xFEC9, fin: 0xFECA, ini: 0xFECB, med: 0xFECC, type: "D" }, // AIN
  0x063A: { iso: 0xFECD, fin: 0xFECE, ini: 0xFECF, med: 0xFED0, type: "D" }, // GHAIN
  0x0641: { iso: 0xFED1, fin: 0xFED2, ini: 0xFED3, med: 0xFED4, type: "D" }, // FEH
  0x0642: { iso: 0xFED5, fin: 0xFED6, ini: 0xFED7, med: 0xFED8, type: "D" }, // QAF
  0x0643: { iso: 0xFED9, fin: 0xFEDA, ini: 0xFEDB, med: 0xFEDC, type: "D" }, // KAF
  0x0644: { iso: 0xFEDD, fin: 0xFEDE, ini: 0xFEDF, med: 0xFEE0, type: "D" }, // LAM
  0x0645: { iso: 0xFEE1, fin: 0xFEE2, ini: 0xFEE3, med: 0xFEE4, type: "D" }, // MEEM
  0x0646: { iso: 0xFEE5, fin: 0xFEE6, ini: 0xFEE7, med: 0xFEE8, type: "D" }, // NOON
  0x0647: { iso: 0xFEE9, fin: 0xFEEA, ini: 0xFEEB, med: 0xFEEC, type: "D" }, // HEH
  0x0648: { iso: 0xFEED, fin: 0xFEEE, type: "R" }, // WAW
  0x0649: { iso: 0xFEEF, fin: 0xFEF0, type: "R" }, // ALEF MAKSURA
  0x064A: { iso: 0xFEF1, fin: 0xFEF2, ini: 0xFEF3, med: 0xFEF4, type: "D" }, // YEH
};

// LAM-ALEF ligatures: LAM (0644) followed by an ALEF variant
const LAM_ALEF: Record<number, { iso: number; fin: number }> = {
  0x0622: { iso: 0xFEF5, fin: 0xFEF6 }, // LAM + ALEF MADDA
  0x0623: { iso: 0xFEF7, fin: 0xFEF8 }, // LAM + ALEF HAMZA
  0x0625: { iso: 0xFEF9, fin: 0xFEFA }, // LAM + ALEF HAMZA BELOW
  0x0627: { iso: 0xFEFB, fin: 0xFEFC }, // LAM + ALEF
};

const isDiacritic = (cp: number) => (cp >= 0x064B && cp <= 0x065F) || cp === 0x0670;
const isArabicLetter = (cp: number) => !!TABLE[cp];

function joinsRight(cp: number) {
  // "joins to right" means it can connect to the previous (right-side) letter
  const f = TABLE[cp];
  return !!f && f.type !== "U";
}
function joinsLeft(cp: number) {
  // "joins to left" means it can connect to the next (left-side) letter
  const f = TABLE[cp];
  return !!f && f.type === "D";
}

function pickForm(cp: number, prev: number | null, next: number | null): string {
  const f = TABLE[cp];
  if (!f) return String.fromCodePoint(cp);
  // Skip transparent (diacritics) when determining context
  const prevJoinsLeft = prev != null && joinsLeft(prev);
  const nextJoinsRight = next != null && joinsRight(next);
  let code: number;
  if (f.type === "D") {
    if (prevJoinsLeft && nextJoinsRight && f.med) code = f.med;
    else if (prevJoinsLeft && f.fin) code = f.fin;
    else if (nextJoinsRight && f.ini) code = f.ini;
    else code = f.iso;
  } else if (f.type === "R") {
    if (prevJoinsLeft && f.fin) code = f.fin;
    else code = f.iso;
  } else {
    code = f.iso;
  }
  return String.fromCodePoint(code);
}

export function shapeArabic(input: string): string {
  if (!input) return input;
  const cps: number[] = Array.from(input).map(s => s.codePointAt(0)!);
  const out: string[] = [];
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (isDiacritic(cp)) { out.push(String.fromCodePoint(cp)); continue; }
    if (!isArabicLetter(cp)) { out.push(String.fromCodePoint(cp)); continue; }
    // LAM + ALEF ligature
    if (cp === 0x0644 && i + 1 < cps.length && LAM_ALEF[cps[i + 1]]) {
      // determine if LAM has a previous left-joining letter
      let prev: number | null = null;
      for (let j = i - 1; j >= 0; j--) { if (!isDiacritic(cps[j])) { prev = cps[j]; break; } }
      const lig = LAM_ALEF[cps[i + 1]];
      out.push(String.fromCodePoint((prev != null && joinsLeft(prev)) ? lig.fin : lig.iso));
      i++; // consume ALEF
      continue;
    }
    let prev: number | null = null, next: number | null = null;
    for (let j = i - 1; j >= 0; j--) { if (!isDiacritic(cps[j])) { prev = cps[j]; break; } }
    for (let j = i + 1; j < cps.length; j++) { if (!isDiacritic(cps[j])) { next = cps[j]; break; } }
    out.push(pickForm(cp, prev, next));
  }
  return out.join("");
}

// Reverse Arabic-letter runs in a logical-order string for visual RTL rendering.
// Latin/digit segments inside the string keep their LTR order.
export function visualizeRtl(input: string): string {
  if (!input) return input;
  const isArabicChar = (ch: string) => {
    const cp = ch.codePointAt(0)!;
    return (cp >= 0x0600 && cp <= 0x06FF) || (cp >= 0xFB50 && cp <= 0xFDFF) || (cp >= 0xFE70 && cp <= 0xFEFF);
  };
  const chars = Array.from(input);
  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { out.push(buf.reverse().join("")); buf = []; } };
  for (const ch of chars) {
    if (isArabicChar(ch) || ch === " " && buf.length) {
      buf.push(ch);
    } else {
      flush();
      out.push(ch);
    }
  }
  flush();
  // If the line is predominantly Arabic, reverse the whole sequence so the
  // line itself reads right-to-left.
  const arCount = chars.filter(isArabicChar).length;
  if (arCount * 2 > chars.length) {
    return out.reverse().join("").trimStart();
  }
  return out.join("");
}

export function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

export function prepareArabic(text: string): string {
  if (!hasArabic(text)) return text;
  return visualizeRtl(shapeArabic(text));
}
