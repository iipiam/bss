const AR_ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const AR_TEENS = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const AR_TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const AR_HUNDREDS = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];

function arUnder1000(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h > 0) parts.push(AR_HUNDREDS[h]);
  if (r > 0) {
    if (r < 10) parts.push(AR_ONES[r]);
    else if (r < 20) parts.push(AR_TEENS[r - 10]);
    else {
      const t = Math.floor(r / 10);
      const o = r % 10;
      if (o > 0) parts.push(`${AR_ONES[o]} و${AR_TENS[t]}`);
      else parts.push(AR_TENS[t]);
    }
  }
  return parts.join(" و");
}

function arGroup(n: number, singular: string, dual: string, plural3to10: string, plural11plus: string): string {
  if (n === 0) return "";
  if (n === 1) return singular;
  if (n === 2) return dual;
  const words = arUnder1000(n);
  if (n >= 3 && n <= 10) return `${words} ${plural3to10}`;
  // 11 and above use singular accusative
  return `${words} ${plural11plus}`;
}

export function numberToArabicWords(num: number): string {
  if (!isFinite(num)) return String(num);
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "صفر";

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(arGroup(billions, "مليار", "ملياران", "مليارات", "ملياراً"));
  if (millions > 0) parts.push(arGroup(millions, "مليون", "مليونان", "ملايين", "مليوناً"));
  if (thousands > 0) parts.push(arGroup(thousands, "ألف", "ألفان", "آلاف", "ألفاً"));
  if (rest > 0) parts.push(arUnder1000(rest));

  return parts.join(" و");
}

const EN_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const EN_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function enUnder1000(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h > 0) parts.push(`${EN_ONES[h]} hundred`);
  if (r > 0) {
    if (r < 10) parts.push(EN_ONES[r]);
    else if (r < 20) parts.push(EN_TEENS[r - 10]);
    else {
      const t = Math.floor(r / 10);
      const o = r % 10;
      parts.push(o > 0 ? `${EN_TENS[t]}-${EN_ONES[o]}` : EN_TENS[t]);
    }
  }
  return parts.join(" ");
}

export function numberToEnglishWords(num: number): string {
  if (!isFinite(num)) return String(num);
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "zero";

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(`${enUnder1000(billions)} billion`);
  if (millions > 0) parts.push(`${enUnder1000(millions)} million`);
  if (thousands > 0) parts.push(`${enUnder1000(thousands)} thousand`);
  if (rest > 0) parts.push(enUnder1000(rest));

  return parts.join(" ");
}

export function amountToWords(amount: number, lang: "ar" | "en"): string {
  if (!isFinite(amount)) return String(amount);
  const abs = Math.abs(amount);
  const riyals = Math.floor(abs);
  const halalas = Math.round((abs - riyals) * 100);

  if (lang === "ar") {
    // Use "ريال سعودي" form to avoid awkward double-tanween when the amount
    // already ends in ألفاً/مليوناً (e.g. "سبعة وخمسون ألفاً ريالاً").
    const riyalsWord = riyals === 0 ? "صفر ريال سعودي" :
      riyals === 1 ? "ريال سعودي واحد" :
      riyals === 2 ? "ريالان سعوديان" :
      `${numberToArabicWords(riyals)} ريال سعودي`;
    if (halalas === 0) return riyalsWord;
    const halalaWord = halalas === 1 ? "هللة واحدة" :
      halalas === 2 ? "هللتان" :
      (halalas >= 3 && halalas <= 10) ? `${numberToArabicWords(halalas)} هللات` :
      `${numberToArabicWords(halalas)} هللة`;
    return `${riyalsWord} و${halalaWord}`;
  }

  const riyalsWord = `${numberToEnglishWords(riyals)} ${riyals === 1 ? "riyal" : "riyals"}`;
  if (halalas === 0) return riyalsWord;
  const halalaWord = `${numberToEnglishWords(halalas)} ${halalas === 1 ? "halala" : "halalas"}`;
  return `${riyalsWord} and ${halalaWord}`;
}

export function percentageToWords(pct: number, lang: "ar" | "en"): string {
  if (!isFinite(pct)) return String(pct);
  const abs = Math.abs(pct);
  const whole = Math.floor(abs);
  const fracStr = abs.toFixed(2).split(".")[1].replace(/0+$/, "");
  const fracDigits = fracStr ? fracStr.split("").map(d => parseInt(d, 10)) : [];

  if (lang === "ar") {
    const wholePart = whole === 0 ? "صفر" : numberToArabicWords(whole);
    if (fracDigits.length === 0) return `${wholePart} بالمئة`;
    const fracPart = fracDigits.map(d => AR_ONES[d] || "صفر").join(" ");
    return `${wholePart} فاصلة ${fracPart} بالمئة`;
  }

  const wholePart = whole === 0 ? "zero" : numberToEnglishWords(whole);
  if (fracDigits.length === 0) return `${wholePart} percent`;
  const fracPart = fracDigits.map(d => EN_ONES[d] || "zero").join(" ");
  return `${wholePart} point ${fracPart} percent`;
}
