import type { CompanyProfile } from "@shared/schema";
import { getBrowser } from "./invoice";

function escapeHtml(text: string | undefined | null): string {
  if (text === undefined || text === null) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] as string));
}

// SSRF protection: only allow inline data: URIs; reject http(s)/file/etc.
function safeImg(src: string | undefined | null): string | null {
  if (!src || typeof src !== "string") return null;
  if (!/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(src.trim())) return null;
  return src;
}

const ALLOWED_HEADER_STYLES = new Set(["gradient", "solid", "image", "split", "minimal", "diagonal", "wave", "ribbon"]);
const ALLOWED_TEMPLATES = new Set([
  "modern", "corporate", "creative", "minimal", "executive", "elegant", "bold", "tech",
  "luxury", "monochrome", "geometric", "neon", "editorial", "premium", "vintage", "gradient",
]);

const FONT_CSS: Record<string, string> = {
  inter: "Inter, system-ui, sans-serif",
  manrope: "Manrope, system-ui, sans-serif",
  poppins: "Poppins, system-ui, sans-serif",
  montserrat: "Montserrat, system-ui, sans-serif",
  playfair: '"Playfair Display", Georgia, serif',
  lora: "Lora, Georgia, serif",
  roboto: "Roboto, system-ui, sans-serif",
  raleway: "Raleway, system-ui, sans-serif",
  oswald: "Oswald, Impact, sans-serif",
  dmserif: '"DM Serif Display", Georgia, serif',
};

interface Recipe {
  frontBg: string; backBg: string; text: string; accentBar: string; font: string;
  border?: boolean; oversized?: boolean; neon?: boolean; invertedBack?: boolean;
}

function recipeFor(tpl: string, primary: string, secondary: string, accent: string, fontCss: string): Recipe {
  switch (tpl) {
    case "modern":     return { frontBg: `linear-gradient(135deg, ${primary}, ${accent})`, backBg: `linear-gradient(135deg, ${secondary}, ${primary})`, text: "white", accentBar: accent, font: fontCss };
    case "corporate":  return { frontBg: secondary, backBg: secondary, text: "white", accentBar: primary, font: '"Playfair Display", Georgia, serif' };
    case "creative":   return { frontBg: `radial-gradient(circle at 20% 20%, ${accent}, ${primary} 70%)`, backBg: `radial-gradient(circle at 80% 80%, ${primary}, ${accent} 70%)`, text: "white", accentBar: "white", font: fontCss };
    case "minimal":    return { frontBg: "#ffffff", backBg: "#ffffff", text: secondary, accentBar: primary, font: fontCss, border: true };
    case "executive":  return { frontBg: `linear-gradient(180deg, #0b1220, ${secondary})`, backBg: `linear-gradient(180deg, ${secondary}, #0b1220)`, text: "white", accentBar: accent, font: '"Playfair Display", Georgia, serif' };
    case "elegant":    return { frontBg: "#fdfaf3", backBg: "#fdfaf3", text: "#2b1d10", accentBar: secondary, font: '"Playfair Display", Georgia, serif', border: true };
    case "bold":       return { frontBg: primary, backBg: secondary, text: "white", accentBar: accent, font: fontCss, oversized: true };
    case "tech":       return { frontBg: `linear-gradient(135deg, #0f172a, ${primary})`, backBg: `linear-gradient(135deg, ${primary}, #0f172a)`, text: "white", accentBar: accent, font: "Manrope, system-ui, sans-serif" };
    case "luxury":     return { frontBg: `linear-gradient(135deg, #0a0a0a, #1a1a1a)`, backBg: `linear-gradient(135deg, #1a1a1a, #0a0a0a)`, text: "#facc15", accentBar: "#facc15", font: '"DM Serif Display", Georgia, serif', border: true };
    case "monochrome": return { frontBg: "#ffffff", backBg: "#111111", text: "#111111", accentBar: "#111111", font: fontCss, border: true, invertedBack: true };
    case "geometric":  return { frontBg: `conic-gradient(from 45deg, ${primary} 0deg 90deg, ${secondary} 90deg 180deg, ${accent} 180deg 270deg, ${primary} 270deg 360deg)`, backBg: `linear-gradient(45deg, ${primary} 25%, ${secondary} 25% 50%, ${accent} 50% 75%, ${primary} 75%)`, text: "white", accentBar: "white", font: fontCss };
    case "neon":       return { frontBg: `radial-gradient(circle at 30% 70%, ${accent}88, #050816 70%)`, backBg: `radial-gradient(circle at 70% 30%, ${primary}88, #050816 70%)`, text: "#a5f3fc", accentBar: accent, font: "Manrope, system-ui, sans-serif", neon: true };
    case "editorial":  return { frontBg: "#fafaf9", backBg: "#fafaf9", text: "#1c1917", accentBar: primary, font: '"Playfair Display", Georgia, serif', border: true, oversized: true };
    case "premium":    return { frontBg: "linear-gradient(135deg, #0c1a3e, #1e3a8a)", backBg: "linear-gradient(135deg, #1e3a8a, #0c1a3e)", text: "white", accentBar: "#fbbf24", font: '"DM Serif Display", Georgia, serif' };
    case "vintage":    return { frontBg: "linear-gradient(135deg, #f5e6c8, #e7c98f)", backBg: "linear-gradient(135deg, #e7c98f, #f5e6c8)", text: "#3b2f1a", accentBar: "#92400e", font: '"Playfair Display", Georgia, serif', border: true };
    case "gradient":   return { frontBg: `linear-gradient(120deg, ${primary} 0%, ${accent} 50%, ${secondary} 100%)`, backBg: `linear-gradient(300deg, ${primary} 0%, ${accent} 50%, ${secondary} 100%)`, text: "white", accentBar: "white", font: fontCss };
    default:           return { frontBg: primary, backBg: secondary, text: "white", accentBar: accent, font: fontCss };
  }
}

function getStrings(lang: string) {
  if (lang === "ar") {
    return { front: "الواجهة الأمامية", back: "الواجهة الخلفية", scan: "امسح", services: "الخدمات", yourName: "اسمك", jobTitle: "المسمى الوظيفي" };
  }
  return { front: "Front", back: "Back", scan: "Scan", services: "Services", yourName: "Your Name", jobTitle: "Job Title" };
}

function qrUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
}

function renderHeaderAccent(headerStyle: string, accent: string): string {
  switch (headerStyle) {
    case "ribbon":   return `<div style="position:absolute;left:0;top:0;bottom:0;width:3mm;background:${accent};"></div>`;
    case "diagonal": return `<div style="position:absolute;top:-10mm;right:-10mm;width:30mm;height:30mm;background:${accent};transform:rotate(20deg);opacity:0.35;"></div>`;
    case "wave":     return `<div style="position:absolute;left:0;right:0;bottom:0;height:4mm;background:${accent};clip-path: polygon(0 60%, 8% 30%, 18% 60%, 28% 30%, 38% 60%, 48% 30%, 58% 60%, 68% 30%, 78% 60%, 88% 30%, 100% 60%, 100% 100%, 0 100%);"></div>`;
    case "solid":    return `<div style="position:absolute;left:0;right:0;top:0;height:2mm;background:${accent};"></div>`;
    case "split":    return `<div style="position:absolute;left:0;top:0;bottom:0;width:25%;background:${accent};opacity:0.25;"></div>`;
    case "minimal":  return "";
    case "image":
    case "gradient":
    default:         return "";
  }
}

function renderFront(card: any, r: Recipe, qrSrc: string | null, headerStyle: string): string {
  const nameSize = r.oversized ? "20pt" : "16pt";
  const logo = safeImg(card.logoDataUrl);
  const photo = safeImg(card.photoDataUrl);
  return `
    <div class="card" style="background:${r.frontBg};color:${r.text};font-family:${r.font};${r.border ? `border:1px solid ${"#00000022"};` : ""}${r.neon ? `box-shadow: inset 0 0 20mm ${r.accentBar}33;` : ""}">
      ${renderHeaderAccent(headerStyle, r.accentBar)}
      <div class="inner">
        <div class="row top">
          <div class="brand">
            ${logo ? `<img src="${logo}" class="logo"/>` : ""}
            ${card.companyName ? `<div class="company">${escapeHtml(card.companyName)}</div>` : ""}
          </div>
          ${photo ? `<img src="${photo}" class="photo"/>` : ""}
        </div>
        <div class="mid">
          <div class="name" style="font-size:${nameSize};">${escapeHtml(card.fullName || "")}${card.pronouns ? ` <span class="pronouns">(${escapeHtml(card.pronouns)})</span>` : ""}</div>
          <div class="bar" style="background:${r.accentBar};"></div>
          <div class="title">${escapeHtml(card.jobTitle || "")}</div>
          ${card.tagline ? `<div class="tagline">${escapeHtml(card.tagline)}</div>` : ""}
        </div>
        <div class="bottom">
          ${card.phone ? `<div class="line">☎ ${escapeHtml(card.phone)}</div>` : ""}
          ${card.email ? `<div class="line">✉ ${escapeHtml(card.email)}</div>` : ""}
          ${card.website ? `<div class="line">🌐 ${escapeHtml(card.website)}</div>` : ""}
          ${card.address ? `<div class="line">📍 ${escapeHtml(card.address)}</div>` : ""}
        </div>
      </div>
    </div>`;
}

function renderBack(card: any, r: Recipe, qrSrc: string | null, lang: string): string {
  const s = getStrings(lang);
  const backText = r.invertedBack ? "#ffffff" : r.text;
  const accent = r.invertedBack ? "#ffffff" : r.accentBar;
  return `
    <div class="card" style="background:${r.backBg};color:${backText};font-family:${r.font};${r.border ? `border:1px solid ${"#00000022"};` : ""}${r.neon ? `box-shadow: inset 0 0 20mm ${r.accentBar}33;` : ""}">
      <div class="inner back">
        <div class="back-left">
          ${card.tagline ? `<div class="back-tagline">"${escapeHtml(card.tagline)}"</div>` : ""}
          ${(card.expertise && card.expertise.length > 0) ? `
            <div class="back-services-label">${s.services}</div>
            <ul class="services">
              ${card.expertise.slice(0, 6).map((e: string) => `<li><span class="bullet" style="background:${accent};"></span>${escapeHtml(e)}</li>`).join("")}
            </ul>` : ""}
          <div class="back-contact">
            ${card.secondaryPhone || card.phone ? `<div class="line">☎ ${escapeHtml(card.secondaryPhone || card.phone)}</div>` : ""}
            ${card.whatsapp ? `<div class="line">⌬ ${escapeHtml(card.whatsapp)}</div>` : ""}
            ${card.linkedin ? `<div class="line">in ${escapeHtml(card.linkedin)}</div>` : ""}
            ${card.instagram ? `<div class="line">@ ${escapeHtml(card.instagram)}</div>` : ""}
            ${card.twitter ? `<div class="line">X ${escapeHtml(card.twitter)}</div>` : ""}
            ${card.calendly ? `<div class="line">📅 ${escapeHtml(card.calendly)}</div>` : ""}
          </div>
        </div>
        <div class="back-right">
          ${qrSrc ? `<img src="${qrSrc}" class="qr"/>` : `<div class="qr-empty">QR</div>`}
          <div class="scan">${s.scan}</div>
        </div>
      </div>
    </div>`;
}

export async function generateBusinessCardPDF(profile: CompanyProfile): Promise<Buffer> {
  const card: any = (profile as any).businessCard || {};
  const useOwn = card.useProfileBranding === false;
  const primary   = useOwn ? (card.primaryColor   || (profile as any).primaryColor   || "#2563eb") : ((profile as any).primaryColor   || card.primaryColor   || "#2563eb");
  const secondary = useOwn ? (card.secondaryColor || (profile as any).secondaryColor || "#0f172a") : ((profile as any).secondaryColor || card.secondaryColor || "#0f172a");
  const accent    = useOwn ? (card.accentColor    || (profile as any).accentColor    || "#f59e0b") : ((profile as any).accentColor    || card.accentColor    || "#f59e0b");
  const fontKey   = useOwn ? (card.fontFamily || (profile as any).fontFamily || "inter") : ((profile as any).fontFamily || card.fontFamily || "inter");
  const fontCss = FONT_CSS[fontKey] || FONT_CSS.inter;
  const lang = (useOwn ? (card.language || (profile as any).language) : ((profile as any).language || card.language)) || "en";
  const rawTpl = card.template || "modern";
  const tpl = ALLOWED_TEMPLATES.has(rawTpl) ? rawTpl : "modern";
  const rawHeader = useOwn ? (card.headerStyle || (profile as any).headerStyle) : ((profile as any).headerStyle || card.headerStyle);
  const headerStyle = rawHeader && ALLOWED_HEADER_STYLES.has(rawHeader) ? rawHeader : "gradient";
  const r = recipeFor(tpl, primary, secondary, accent, fontCss);

  const qrData = card.qrData || card.website || card.linkedin || card.email || "";
  const qrSrc = qrData ? qrUrl(qrData) : null;

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8"/>
  <title>Business Card</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Manrope:wght@400;600;800&family=Poppins:wght@400;600;800&family=Montserrat:wght@400;600;800&family=Playfair+Display:wght@400;700&family=Lora:wght@400;700&family=Roboto:wght@400;700&family=Raleway:wght@400;700;800&family=Oswald:wght@400;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
  <style>
    @page { size: 89mm 51mm; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin:0; padding:0; }
    .page { width: 89mm; height: 51mm; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .card { width: 89mm; height: 51mm; position: relative; overflow: hidden; }
    .inner { position:absolute; inset:0; padding: 4mm 5mm; display:flex; flex-direction:column; justify-content:space-between; }
    .inner.back { flex-direction: row; gap: 4mm; }
    .row.top { display:flex; align-items:flex-start; justify-content:space-between; gap: 3mm; }
    .brand { display:flex; align-items:center; gap: 2mm; min-width:0; }
    .logo { height: 9mm; width: 9mm; object-fit: contain; background: rgba(255,255,255,0.92); border-radius: 1.2mm; padding: 0.6mm; }
    .company { font-weight: 800; font-size: 9pt; }
    .photo { height: 14mm; width: 14mm; border-radius: 50%; object-fit: cover; border: 0.5mm solid rgba(255,255,255,0.7); }
    .mid .name { font-weight: 800; line-height: 1.1; }
    .mid .pronouns { font-weight: 400; font-size: 7pt; opacity: 0.8; }
    .bar { height: 0.6mm; width: 12mm; margin: 1.2mm 0; border-radius: 2mm; }
    .mid .title { font-size: 8pt; opacity: 0.95; }
    .mid .tagline { font-size: 7pt; font-style: italic; opacity: 0.8; margin-top: 0.8mm; }
    .bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4mm 3mm; }
    .line { font-size: 7pt; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .back-left { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
    .back-right { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1mm; flex-shrink: 0; }
    .back-tagline { font-size: 7pt; font-style: italic; opacity: 0.85; margin-bottom: 2mm; line-height: 1.3; }
    .back-services-label { font-size: 6pt; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.7; margin-bottom: 1mm; }
    ul.services { list-style: none; padding: 0; margin: 0 0 2mm; }
    ul.services li { font-size: 7pt; line-height: 1.3; display: flex; align-items: center; gap: 1.4mm; }
    ul.services .bullet { display: inline-block; width: 1.2mm; height: 1.2mm; border-radius: 50%; flex-shrink: 0; }
    .back-contact .line { font-size: 6.5pt; }
    .qr { width: 22mm; height: 22mm; background: white; padding: 0.6mm; border-radius: 1mm; }
    .qr-empty { width: 22mm; height: 22mm; background: rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; border-radius: 1mm; font-size: 9pt; }
    .scan { font-size: 5.5pt; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="page">${renderFront(card, r, qrSrc, headerStyle)}</div>
  <div class="page">${renderBack(card, r, qrSrc, lang)}</div>
</body>
</html>`;

  let lastErr: any;
  for (let attempt = 0; attempt < 2; attempt++) {
    let browser: any;
    let page: any;
    try {
      browser = await getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
      try { await page.evaluate(() => (document as any).fonts?.ready); } catch {}
      const pdf = await page.pdf({
        width: "89mm",
        height: "51mm",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        preferCSSPageSize: true,
      });
      await page.close().catch(() => {});
      return Buffer.from(pdf);
    } catch (err: any) {
      lastErr = err;
      await page?.close().catch(() => {});
      const msg = String(err?.message || "");
      const isStaleBrowser = msg.includes("frame was detached") || msg.includes("Target closed") || msg.includes("disconnected") || msg.includes("Protocol error");
      if (isStaleBrowser && browser) { try { await browser.close(); } catch {} }
      if (!isStaleBrowser) break;
    }
  }
  throw lastErr;
}
