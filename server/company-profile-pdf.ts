import type { CompanyProfile } from "@shared/schema";
import { getBrowser } from "./invoice";

function escapeHtml(text: string | undefined | null): string {
  if (text === undefined || text === null) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] as string));
}

function nl2br(text: string | undefined | null): string {
  return escapeHtml(text).replace(/\n/g, "<br/>");
}

function pickName(p: CompanyProfile) {
  if (p.language === "ar" && p.companyNameAr) return p.companyNameAr;
  return p.companyName || "Company";
}
function pickField(p: CompanyProfile, en?: string | null, ar?: string | null) {
  if (p.language === "ar" && ar) return ar;
  return en || ar || "";
}

const PLACEHOLDER_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' rx='24' fill='#e2e8f0'/><text x='50%' y='54%' font-family='Inter,Arial' font-size='80' fill='#94a3b8' text-anchor='middle' dominant-baseline='middle' font-weight='700'>C</text></svg>`,
)}`;

const PLACEHOLDER_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#e0e7ff'/><stop offset='100%' stop-color='#c7d2fe'/></linearGradient></defs><rect width='600' height='400' fill='url(#g)'/><circle cx='180' cy='160' r='60' fill='#a5b4fc' opacity='0.6'/><path d='M0 320 L200 220 L380 290 L600 200 L600 400 L0 400 Z' fill='#818cf8' opacity='0.6'/></svg>`,
)}`;

interface Strings {
  about: string; vision: string; mission: string; values: string;
  services: string; achievements: string; testimonials: string;
  gallery: string; contact: string; email: string; phone: string;
  address: string; website: string; cover: string; profile: string;
  page: string; of: string; partners: string;
}
function getStrings(lang: string): Strings {
  if (lang === "ar") {
    return {
      about: "نبذة عنّا", vision: "رؤيتنا", mission: "رسالتنا", values: "قيمنا",
      services: "خدماتنا ومنتجاتنا", achievements: "إنجازاتنا", testimonials: "آراء العملاء",
      gallery: "معرض الصور", contact: "تواصل معنا", email: "البريد الإلكتروني",
      phone: "الهاتف", address: "العنوان", website: "الموقع الإلكتروني",
      cover: "الملف التعريفي للشركة", profile: "ملف الشركة", page: "صفحة", of: "من",
      partners: "عملاؤنا",
    };
  }
  return {
    about: "About Us", vision: "Our Vision", mission: "Our Mission", values: "Our Values",
    services: "Services & Products", achievements: "Key Achievements", testimonials: "Testimonials",
    gallery: "Gallery", contact: "Contact Us", email: "Email", phone: "Phone",
    address: "Address", website: "Website", cover: "Company Profile", profile: "Profile",
    page: "Page", of: "of", partners: "Our Clients",
  };
}

// Shared "Our Clients" / partners block rendered the same way across all
// four template variants. Hidden entirely when the array is empty.
function renderPartnersBlock(p: CompanyProfile, s: Strings, opts: { titleStyle?: string; prefix?: string } = {}): string {
  const partners = (p as any).partners as Array<{ name: string; logoDataUrl: string; website?: string }> | undefined;
  if (!partners || partners.length === 0) return "";
  const prefix = opts.prefix || "";
  const titleStyle = opts.titleStyle || `color: ${p.secondaryColor};`;
  // Responsive grid: 4 across when many, 3 otherwise.
  const cols = partners.length >= 4 ? 4 : (partners.length >= 2 ? 3 : 2);
  return `
    <div class="page">
      <h2 class="section-title" style="${titleStyle}">${prefix}${escapeHtml(s.partners)}</h2>
      <div style="display:grid; grid-template-columns: repeat(${cols}, 1fr); gap: 6mm; margin-top: 6mm;">
        ${partners.map((pt) => `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 5mm; text-align: center; page-break-inside: avoid; break-inside: avoid; background: white;">
            <div style="height: 28mm; display: flex; align-items: center; justify-content: center; margin-bottom: 4mm; background: #f8fafc; border-radius: 6px; overflow: hidden;">
              <img src="${(pt.logoDataUrl && pt.logoDataUrl.startsWith("data:image/")) ? pt.logoDataUrl : PLACEHOLDER_LOGO}" style="max-width: 90%; max-height: 24mm; object-fit: contain;"/>
            </div>
            <div style="font-size: 11pt; font-weight: 700; color: ${p.secondaryColor};">${escapeHtml(pt.name)}</div>
            ${pt.website ? `<div style="font-size: 9pt; color: ${p.primaryColor}; margin-top: 2mm; word-break: break-all;">${escapeHtml(pt.website)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>`;
}

function fontStack(p: CompanyProfile): string {
  if (p.language === "ar") return "'Noto Naskh Arabic', Arial, sans-serif";
  switch ((p as any).fontFamily) {
    case "playfair": return "'Playfair Display', Georgia, serif";
    case "montserrat": return "'Montserrat', Arial, sans-serif";
    case "poppins": return "'Poppins', Arial, sans-serif";
    case "lora": return "'Lora', Georgia, serif";
    case "manrope": return "'Manrope', Arial, sans-serif";
    case "roboto": return "'Roboto', Arial, sans-serif";
    case "raleway": return "'Raleway', Arial, sans-serif";
    case "oswald": return "'Oswald', Impact, sans-serif";
    case "dmserif": return "'DM Serif Display', Georgia, serif";
    case "inter":
    default: return "'Inter', Arial, sans-serif";
  }
}

function baseStyles(p: CompanyProfile): string {
  const dir = p.language === "ar" ? "rtl" : "ltr";
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: ${fontStack(p)};
      color: #0f172a;
      background: white;
      direction: ${dir};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 0; }
    /* Each .page is exactly one A4 sheet. We use height (not min-height) so
       contents that would overflow are caught by the cropping rules below
       instead of silently spilling onto a partial second page. */
    .page {
      width: 210mm;
      height: 297mm;
      padding: 16mm 14mm;
      page-break-after: always;
      page-break-inside: avoid;
      break-after: page;
      break-inside: avoid;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }
    .page:last-child { page-break-after: auto; break-after: auto; }
    .cover-page {
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: white;
    }
    h1, h2, h3, h4 { line-height: 1.2; }
    h1 { font-size: 40pt; }
    h2 { font-size: 22pt; }
    h3 { font-size: 13pt; }
    p  { font-size: 11pt; line-height: 1.65; }
    .muted { color: #475569; }
    img { max-width: 100%; }
    /* Tight grid gaps so 2/3/4-column layouts fit A4 width without overflow. */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
    /* Cards never split across pages — prevents half-cards at page bottom. */
    .card { background: #f8fafc; border-radius: 10px; padding: 6mm; page-break-inside: avoid; break-inside: avoid; }
    .stat-value { font-size: 30pt; font-weight: 800; line-height: 1; }
    .stat-label { font-size: 9.5pt; color: #64748b; margin-top: 3mm; }
    .pill {
      display: inline-block;
      padding: 2mm 5mm;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .quote-mark { font-family: 'Playfair Display', serif; font-size: 60pt; line-height: 0.7; opacity: 0.18; }
    .footer {
      position: absolute;
      bottom: 8mm;
      ${dir === "rtl" ? "right: 16mm; left: 16mm;" : "left: 16mm; right: 16mm;"}
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 3mm;
    }
    .section-title {
      font-size: 22pt;
      font-weight: 800;
      margin-bottom: 8mm;
      position: relative;
      padding-bottom: 4mm;
    }
    .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      ${dir === "rtl" ? "right: 0;" : "left: 0;"}
      width: 60px;
      height: 4px;
      background: ${p.primaryColor};
      border-radius: 2px;
    }
  `;
}

// ============== TEMPLATE: MODERN ==============
function renderModern(p: CompanyProfile, s: Strings): string {
  const name = pickName(p);
  const tagline = pickField(p, p.tagline, p.taglineAr);
  const about = pickField(p, p.about, p.aboutAr);
  const vision = pickField(p, p.vision, p.visionAr);
  const mission = pickField(p, p.mission, p.missionAr);

  const cover = `
    <div class="page cover-page" style="background: linear-gradient(135deg, ${p.primaryColor} 0%, ${p.secondaryColor} 100%);">
      <div style="padding: 20mm 16mm 0;">
        ${p.logoDataUrl ? `<img src="${p.logoDataUrl}" style="height: 30mm; max-width: 70mm; background: rgba(255,255,255,0.95); padding: 4mm; border-radius: 10px; object-fit: contain;"/>` : ""}
      </div>
      <div style="padding: 0 16mm; text-align: center;">
        <div class="pill" style="background: rgba(255,255,255,0.18); color: white; margin-bottom: 12mm;">${escapeHtml(s.cover)}</div>
        <h1 style="font-size: 42pt; font-weight: 900; margin-bottom: 8mm; color: white;">${escapeHtml(name)}</h1>
        ${tagline ? `<p style="font-size: 16pt; opacity: 0.92; max-width: 140mm; margin: 0 auto;">${escapeHtml(tagline)}</p>` : ""}
      </div>
      <div style="padding: 0 16mm 20mm; display: flex; justify-content: space-between; align-items: end; font-size: 10pt; opacity: 0.85;">
        <div>${escapeHtml(p.contactWebsite || p.contactEmail || "")}</div>
        <div>${new Date().getFullYear()}</div>
      </div>
    </div>`;

  const aboutPage = (about || vision || mission) ? `
    <div class="page">
      ${about ? `
        <h2 class="section-title" style="color: ${p.secondaryColor};">${escapeHtml(s.about)}</h2>
        <p style="font-size: 12pt; line-height: 1.8; color: #334155; margin-bottom: 14mm;">${nl2br(about)}</p>
      ` : ""}
      ${(vision || mission) ? `
        <div class="grid-2" style="margin-top: 6mm;">
          ${vision ? `
            <div class="card" style="border-${p.language === "ar" ? "right" : "left"}: 4px solid ${p.primaryColor};">
              <div class="pill" style="background: ${p.primaryColor}20; color: ${p.primaryColor}; margin-bottom: 4mm;">${escapeHtml(s.vision)}</div>
              <p style="font-size: 11pt; line-height: 1.7; color: #334155;">${nl2br(vision)}</p>
            </div>` : ""}
          ${mission ? `
            <div class="card" style="border-${p.language === "ar" ? "right" : "left"}: 4px solid ${p.accentColor};">
              <div class="pill" style="background: ${p.accentColor}20; color: ${p.accentColor}; margin-bottom: 4mm;">${escapeHtml(s.mission)}</div>
              <p style="font-size: 11pt; line-height: 1.7; color: #334155;">${nl2br(mission)}</p>
            </div>` : ""}
        </div>
      ` : ""}
    </div>` : "";

  const valuesPage = (p.coreValues && p.coreValues.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">${escapeHtml(s.values)}</h2>
      <div class="grid-2">
        ${p.coreValues.map((v) => `
          <div class="card">
            <h3 style="font-size: 14pt; font-weight: 700; color: ${p.primaryColor}; margin-bottom: 3mm;">${escapeHtml(v.title)}</h3>
            <p style="font-size: 10.5pt; line-height: 1.6; color: #475569;">${nl2br(v.description)}</p>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const servicesPage = (p.services && p.services.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">${escapeHtml(s.services)}</h2>
      <div class="grid-2">
        ${p.services.map((sv) => `
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <img src="${sv.imageDataUrl || PLACEHOLDER_IMG}" style="width: 100%; height: 38mm; object-fit: cover;"/>
            <div style="padding: 6mm;">
              <h3 style="font-size: 13pt; font-weight: 700; color: ${p.secondaryColor}; margin-bottom: 2mm;">${escapeHtml(sv.title)}</h3>
              <p style="font-size: 10pt; line-height: 1.6; color: #475569;">${nl2br(sv.description)}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const achievementsBlock = (p.achievements && p.achievements.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">${escapeHtml(s.achievements)}</h2>
      <div class="grid-${p.achievements.length >= 4 ? 4 : 3}" style="margin-top: 8mm;">
        ${p.achievements.map((a) => `
          <div class="card" style="text-align: center; background: linear-gradient(135deg, ${p.primaryColor}10, ${p.accentColor}10);">
            <div class="stat-value" style="color: ${p.primaryColor};">${escapeHtml(a.value)}</div>
            <div class="stat-label">${escapeHtml(a.label)}</div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const testimonialsBlock = (p.testimonials && p.testimonials.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">${escapeHtml(s.testimonials)}</h2>
      <div style="display: flex; flex-direction: column; gap: 8mm;">
        ${p.testimonials.map((t) => `
          <div class="card" style="position: relative;">
            <div class="quote-mark" style="position: absolute; top: 4mm; ${p.language === "ar" ? "left" : "right"}: 6mm; color: ${p.primaryColor};">"</div>
            <p style="font-size: 11.5pt; line-height: 1.7; font-style: italic; color: #334155; margin-bottom: 5mm;">"${escapeHtml(t.quote)}"</p>
            <div style="display: flex; align-items: center; gap: 4mm;">
              <img src="${t.imageDataUrl || PLACEHOLDER_LOGO}" style="width: 14mm; height: 14mm; border-radius: 50%; object-fit: cover;"/>
              <div>
                <div style="font-weight: 700; color: ${p.secondaryColor};">${escapeHtml(t.name)}</div>
                <div style="font-size: 9pt; color: #64748b;">${escapeHtml(t.role)}</div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const galleryBlock = (p.galleryImages && p.galleryImages.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">${escapeHtml(s.gallery)}</h2>
      <div class="grid-2" style="gap: 4mm;">
        ${p.galleryImages.map((g) => `
          <div style="border-radius: 8px; overflow: hidden;">
            <img src="${g.imageDataUrl}" style="width: 100%; height: 60mm; object-fit: cover; display: block;"/>
            ${g.caption ? `<div style="padding: 2mm 0; font-size: 9pt; color: #64748b; text-align: center;">${escapeHtml(g.caption)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const contactBlock = (p.contactEmail || p.contactPhone || p.contactAddress || p.contactWebsite) ? `
    <div class="page" style="background: linear-gradient(135deg, ${p.secondaryColor} 0%, ${p.primaryColor} 100%); color: white;">
      <h2 style="font-size: 32pt; font-weight: 800; margin-bottom: 10mm; margin-top: 30mm;">${escapeHtml(s.contact)}</h2>
      <div style="font-size: 12pt; line-height: 2; opacity: 0.95;">
        ${p.contactEmail ? `<div><strong style="display:inline-block;width:30mm;opacity:0.7;">${escapeHtml(s.email)}:</strong> ${escapeHtml(p.contactEmail)}</div>` : ""}
        ${p.contactPhone ? `<div><strong style="display:inline-block;width:30mm;opacity:0.7;">${escapeHtml(s.phone)}:</strong> ${escapeHtml(p.contactPhone)}</div>` : ""}
        ${p.contactWebsite ? `<div><strong style="display:inline-block;width:30mm;opacity:0.7;">${escapeHtml(s.website)}:</strong> ${escapeHtml(p.contactWebsite)}</div>` : ""}
        ${p.contactAddress ? `<div style="margin-top:4mm;"><strong style="display:inline-block;width:30mm;opacity:0.7;vertical-align:top;">${escapeHtml(s.address)}:</strong> <span style="display:inline-block;max-width:120mm;">${nl2br(p.contactAddress)}</span></div>` : ""}
      </div>
      <div style="margin-top: 14mm; display: flex; gap: 5mm; flex-wrap: wrap;">
        ${p.socialLinkedin ? `<div class="pill" style="background:rgba(255,255,255,0.18);color:white;">LinkedIn: ${escapeHtml(p.socialLinkedin)}</div>` : ""}
        ${p.socialInstagram ? `<div class="pill" style="background:rgba(255,255,255,0.18);color:white;">Instagram: ${escapeHtml(p.socialInstagram)}</div>` : ""}
        ${p.socialTwitter ? `<div class="pill" style="background:rgba(255,255,255,0.18);color:white;">X / Twitter: ${escapeHtml(p.socialTwitter)}</div>` : ""}
      </div>
      <div style="position:absolute;bottom:18mm;${p.language === "ar" ? "right" : "left"}:16mm;opacity:0.7;font-size:10pt;">© ${new Date().getFullYear()} ${escapeHtml(name)}</div>
    </div>` : "";

  const partnersBlock = renderPartnersBlock(p, s);
  return cover + aboutPage + valuesPage + servicesPage + achievementsBlock + testimonialsBlock + partnersBlock + galleryBlock + contactBlock;
}

// ============== TEMPLATE: CORPORATE ==============
function renderCorporate(p: CompanyProfile, s: Strings): string {
  const name = pickName(p);
  const tagline = pickField(p, p.tagline, p.taglineAr);
  const about = pickField(p, p.about, p.aboutAr);
  const vision = pickField(p, p.vision, p.visionAr);
  const mission = pickField(p, p.mission, p.missionAr);

  const cover = `
    <div class="page cover-page" style="background: ${p.secondaryColor}; color: white;">
      <div style="background: ${p.primaryColor}; height: 8mm;"></div>
      <div style="padding: 25mm 20mm; flex: 1; display:flex; flex-direction:column; justify-content:center;">
        ${p.logoDataUrl ? `<img src="${p.logoDataUrl}" style="height: 28mm; max-width: 70mm; object-fit: contain; margin-bottom: 16mm; background:white; padding:4mm; border-radius:4px;"/>` : ""}
        <div style="border-${p.language === "ar" ? "right" : "left"}: 4px solid ${p.primaryColor}; padding-${p.language === "ar" ? "right" : "left"}: 8mm;">
          <div style="font-size: 11pt; letter-spacing: 4px; opacity: 0.6; margin-bottom: 6mm;">${escapeHtml(s.cover).toUpperCase()}</div>
          <h1 style="font-family: 'Playfair Display', serif; font-size: 38pt; font-weight: 800; line-height: 1.1; margin-bottom: 8mm;">${escapeHtml(name)}</h1>
          ${tagline ? `<p style="font-size: 14pt; opacity: 0.85; max-width: 140mm;">${escapeHtml(tagline)}</p>` : ""}
        </div>
      </div>
      <div style="background: ${p.primaryColor}; padding: 6mm 20mm; display: flex; justify-content: space-between; font-size: 9pt;">
        <span>${escapeHtml(p.contactWebsite || "")}</span>
        <span>${new Date().getFullYear()}</span>
      </div>
    </div>`;

  const aboutPage = (about || vision || mission) ? `
    <div class="page">
      ${about ? `
        <div style="border-${p.language === "ar" ? "right" : "left"}: 6px solid ${p.primaryColor}; padding-${p.language === "ar" ? "right" : "left"}: 6mm; margin-bottom: 14mm;">
          <h2 style="font-family: 'Playfair Display', serif; font-size: 26pt; color: ${p.secondaryColor}; margin-bottom: 6mm;">${escapeHtml(s.about)}</h2>
          <p style="font-size: 11.5pt; line-height: 1.9; color: #334155; text-align: justify;">${nl2br(about)}</p>
        </div>
      ` : ""}
      <div class="grid-2">
        ${vision ? `
          <div style="padding: 8mm; background: ${p.primaryColor}; color: white; border-radius: 4px;">
            <h3 style="font-family: 'Playfair Display', serif; font-size: 18pt; margin-bottom: 5mm;">${escapeHtml(s.vision)}</h3>
            <p style="font-size: 11pt; line-height: 1.7; opacity: 0.95;">${nl2br(vision)}</p>
          </div>` : ""}
        ${mission ? `
          <div style="padding: 8mm; background: ${p.secondaryColor}; color: white; border-radius: 4px;">
            <h3 style="font-family: 'Playfair Display', serif; font-size: 18pt; margin-bottom: 5mm;">${escapeHtml(s.mission)}</h3>
            <p style="font-size: 11pt; line-height: 1.7; opacity: 0.95;">${nl2br(mission)}</p>
          </div>` : ""}
      </div>
    </div>` : "";

  const valuesPage = (p.coreValues && p.coreValues.length > 0) ? `
    <div class="page">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 28pt; color: ${p.secondaryColor}; margin-bottom: 10mm;">${escapeHtml(s.values)}</h2>
      <div style="display: flex; flex-direction: column; gap: 5mm;">
        ${p.coreValues.map((v, i) => `
          <div style="display: flex; gap: 6mm; align-items: start; padding: 5mm; border-bottom: 1px solid #e2e8f0;">
            <div style="min-width: 14mm; height: 14mm; border-radius: 50%; background: ${p.primaryColor}; color: white; display:flex; align-items:center; justify-content:center; font-weight: 800; font-size: 14pt;">${String(i + 1).padStart(2, "0")}</div>
            <div>
              <h3 style="font-size: 14pt; font-weight: 700; color: ${p.secondaryColor}; margin-bottom: 2mm;">${escapeHtml(v.title)}</h3>
              <p style="font-size: 11pt; line-height: 1.7; color: #475569;">${nl2br(v.description)}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const servicesPage = (p.services && p.services.length > 0) ? `
    <div class="page">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 28pt; color: ${p.secondaryColor}; margin-bottom: 10mm;">${escapeHtml(s.services)}</h2>
      ${p.services.map((sv) => `
        <div style="display:grid; grid-template-columns: 60mm 1fr; gap: 6mm; margin-bottom: 6mm; padding-bottom: 6mm; border-bottom: 1px solid #e2e8f0;">
          <img src="${sv.imageDataUrl || PLACEHOLDER_IMG}" style="width:100%; height:40mm; object-fit: cover; border-radius: 4px;"/>
          <div>
            <h3 style="font-size: 14pt; font-weight: 700; color: ${p.primaryColor}; margin-bottom: 3mm;">${escapeHtml(sv.title)}</h3>
            <p style="font-size: 11pt; line-height: 1.7; color: #475569;">${nl2br(sv.description)}</p>
          </div>
        </div>
      `).join("")}
    </div>` : "";

  const achievementsBlock = (p.achievements && p.achievements.length > 0) ? `
    <div class="page" style="background: ${p.secondaryColor}; color: white;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 30pt; margin-bottom: 14mm; margin-top: 20mm;">${escapeHtml(s.achievements)}</h2>
      <div class="grid-${p.achievements.length >= 4 ? 4 : 3}">
        ${p.achievements.map((a) => `
          <div style="text-align: center; padding: 8mm 4mm; border-${p.language === "ar" ? "right" : "left"}: 3px solid ${p.primaryColor};">
            <div class="stat-value" style="color: ${p.primaryColor};">${escapeHtml(a.value)}</div>
            <div class="stat-label" style="color: rgba(255,255,255,0.75);">${escapeHtml(a.label)}</div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const testimonialsBlock = (p.testimonials && p.testimonials.length > 0) ? `
    <div class="page">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 28pt; color: ${p.secondaryColor}; margin-bottom: 10mm;">${escapeHtml(s.testimonials)}</h2>
      ${p.testimonials.map((t) => `
        <div style="margin-bottom: 8mm; padding: 7mm; background: #f8fafc; border-${p.language === "ar" ? "right" : "left"}: 4px solid ${p.primaryColor};">
          <p style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 13pt; color: #334155; line-height: 1.7; margin-bottom: 5mm;">"${escapeHtml(t.quote)}"</p>
          <div style="display: flex; align-items: center; gap: 4mm;">
            <img src="${t.imageDataUrl || PLACEHOLDER_LOGO}" style="width:12mm; height:12mm; border-radius:50%; object-fit:cover;"/>
            <div>
              <div style="font-weight: 700; color: ${p.secondaryColor};">— ${escapeHtml(t.name)}</div>
              <div style="font-size: 9pt; color: #64748b;">${escapeHtml(t.role)}</div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>` : "";

  const galleryBlock = (p.galleryImages && p.galleryImages.length > 0) ? `
    <div class="page">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 28pt; color: ${p.secondaryColor}; margin-bottom: 10mm;">${escapeHtml(s.gallery)}</h2>
      <div class="grid-2" style="gap: 4mm;">
        ${p.galleryImages.map((g) => `
          <div>
            <img src="${g.imageDataUrl}" style="width:100%; height:55mm; object-fit:cover; border-radius: 4px;"/>
            ${g.caption ? `<div style="padding-top:2mm; font-size:9pt; color:#64748b;">${escapeHtml(g.caption)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const contactBlock = (p.contactEmail || p.contactPhone || p.contactAddress || p.contactWebsite) ? `
    <div class="page" style="background: ${p.primaryColor}; color: white;">
      <div style="padding-top: 30mm;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 36pt; margin-bottom: 12mm;">${escapeHtml(s.contact)}</h2>
        <div style="font-size: 13pt; line-height: 2.2; opacity: 0.95;">
          ${p.contactEmail ? `<div><strong style="display:inline-block;width:32mm;opacity:0.7;">${escapeHtml(s.email)}:</strong> ${escapeHtml(p.contactEmail)}</div>` : ""}
          ${p.contactPhone ? `<div><strong style="display:inline-block;width:32mm;opacity:0.7;">${escapeHtml(s.phone)}:</strong> ${escapeHtml(p.contactPhone)}</div>` : ""}
          ${p.contactWebsite ? `<div><strong style="display:inline-block;width:32mm;opacity:0.7;">${escapeHtml(s.website)}:</strong> ${escapeHtml(p.contactWebsite)}</div>` : ""}
          ${p.contactAddress ? `<div style="margin-top:4mm;"><strong style="display:inline-block;width:32mm;opacity:0.7;vertical-align:top;">${escapeHtml(s.address)}:</strong> <span style="display:inline-block;max-width:120mm;">${nl2br(p.contactAddress)}</span></div>` : ""}
        </div>
      </div>
      <div style="position:absolute;bottom:18mm;${p.language === "ar" ? "right" : "left"}:16mm;font-size:10pt;opacity:0.8;">© ${new Date().getFullYear()} ${escapeHtml(name)} — All Rights Reserved</div>
    </div>` : "";

  const partnersBlock = renderPartnersBlock(p, s);
  return cover + aboutPage + valuesPage + servicesPage + achievementsBlock + testimonialsBlock + partnersBlock + galleryBlock + contactBlock;
}

// ============== TEMPLATE: CREATIVE ==============
function renderCreative(p: CompanyProfile, s: Strings): string {
  const name = pickName(p);
  const tagline = pickField(p, p.tagline, p.taglineAr);
  const about = pickField(p, p.about, p.aboutAr);
  const vision = pickField(p, p.vision, p.visionAr);
  const mission = pickField(p, p.mission, p.missionAr);

  const cover = `
    <div class="page cover-page" style="background: white; color: ${p.secondaryColor};">
      <div style="position:absolute;top:-40mm;${p.language === "ar" ? "left" : "right"}:-40mm;width:140mm;height:140mm;border-radius:50%;background:${p.primaryColor};opacity:0.15;"></div>
      <div style="position:absolute;bottom:-30mm;${p.language === "ar" ? "right" : "left"}:-30mm;width:110mm;height:110mm;border-radius:50%;background:${p.accentColor};opacity:0.2;"></div>
      <div style="padding: 22mm 20mm 0; position:relative;">
        ${p.logoDataUrl ? `<img src="${p.logoDataUrl}" style="height: 26mm; max-width: 60mm; object-fit: contain;"/>` : ""}
      </div>
      <div style="padding: 0 20mm; position:relative;">
        <div style="font-size: 11pt; color: ${p.primaryColor}; font-weight: 700; letter-spacing: 6px; margin-bottom: 8mm;">${escapeHtml(s.cover).toUpperCase()}</div>
        <h1 style="font-size: 46pt; font-weight: 900; line-height: 1; margin-bottom: 10mm; color: ${p.primaryColor};">${escapeHtml(name)}</h1>
        ${tagline ? `<p style="font-size: 17pt; color: #475569; max-width: 150mm; font-weight: 300; line-height: 1.4;">${escapeHtml(tagline)}</p>` : ""}
      </div>
      <div style="padding: 0 20mm 22mm; position:relative; display: flex; gap: 4mm; flex-wrap: wrap;">
        <div class="pill" style="background:${p.primaryColor};color:white;">${new Date().getFullYear()}</div>
        ${p.contactWebsite ? `<div class="pill" style="background:${p.accentColor};color:white;">${escapeHtml(p.contactWebsite)}</div>` : ""}
      </div>
    </div>`;

  const aboutPage = (about || vision || mission) ? `
    <div class="page">
      ${about ? `
        <div style="margin-bottom: 14mm;">
          <div style="display:inline-block;font-size:14pt;font-weight:900;color:${p.primaryColor};margin-bottom:4mm;">✦ ${escapeHtml(s.about)}</div>
          <h2 style="font-size: 30pt; font-weight: 800; color: ${p.secondaryColor}; line-height: 1.2; margin-bottom: 8mm;">${escapeHtml(name)}</h2>
          <p style="font-size: 12pt; line-height: 1.8; color: #334155;">${nl2br(about)}</p>
        </div>
      ` : ""}
      ${vision ? `
        <div style="padding: 8mm; background: linear-gradient(135deg, ${p.primaryColor}, ${p.accentColor}); color: white; border-radius: 14px; margin-bottom: 6mm;">
          <div style="font-size:11pt; opacity:0.85; margin-bottom: 3mm;">✦ ${escapeHtml(s.vision)}</div>
          <p style="font-size:14pt; line-height:1.6; font-weight: 500;">${nl2br(vision)}</p>
        </div>
      ` : ""}
      ${mission ? `
        <div style="padding: 8mm; background: ${p.secondaryColor}; color: white; border-radius: 14px;">
          <div style="font-size:11pt; opacity:0.85; margin-bottom: 3mm;">✦ ${escapeHtml(s.mission)}</div>
          <p style="font-size:14pt; line-height:1.6; font-weight: 500;">${nl2br(mission)}</p>
        </div>
      ` : ""}
    </div>` : "";

  const valuesPage = (p.coreValues && p.coreValues.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">✦ ${escapeHtml(s.values)}</h2>
      <div class="grid-2">
        ${p.coreValues.map((v, i) => {
          const colors = [p.primaryColor, p.accentColor, p.secondaryColor];
          const c = colors[i % colors.length];
          return `
            <div style="padding: 7mm; border-radius: 14px; background: ${c}15; border: 2px solid ${c}30;">
              <div style="font-size: 32pt; font-weight: 900; color: ${c}; line-height: 1; margin-bottom: 4mm;">${String(i + 1).padStart(2, "0")}</div>
              <h3 style="font-size: 14pt; font-weight: 700; color: ${p.secondaryColor}; margin-bottom: 3mm;">${escapeHtml(v.title)}</h3>
              <p style="font-size: 10.5pt; line-height: 1.6; color: #475569;">${nl2br(v.description)}</p>
            </div>`;
        }).join("")}
      </div>
    </div>` : "";

  const servicesPage = (p.services && p.services.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">✦ ${escapeHtml(s.services)}</h2>
      <div class="grid-2">
        ${p.services.map((sv, i) => {
          const colors = [p.primaryColor, p.accentColor];
          const c = colors[i % colors.length];
          return `
            <div style="border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <div style="height: 38mm; background: linear-gradient(135deg, ${c}, ${p.secondaryColor}); position: relative; overflow: hidden;">
                <img src="${sv.imageDataUrl || PLACEHOLDER_IMG}" style="width:100%; height:100%; object-fit:cover; mix-blend-mode: overlay; opacity: 0.85;"/>
              </div>
              <div style="padding: 6mm;">
                <h3 style="font-size: 13pt; font-weight: 700; color: ${c}; margin-bottom: 3mm;">${escapeHtml(sv.title)}</h3>
                <p style="font-size: 10pt; line-height: 1.6; color: #475569;">${nl2br(sv.description)}</p>
              </div>
            </div>`;
        }).join("")}
      </div>
    </div>` : "";

  const achievementsBlock = (p.achievements && p.achievements.length > 0) ? `
    <div class="page" style="background: linear-gradient(135deg, ${p.primaryColor}, ${p.accentColor}); color: white;">
      <h2 style="font-size: 32pt; font-weight: 800; margin: 25mm 0 14mm;">✦ ${escapeHtml(s.achievements)}</h2>
      <div class="grid-${p.achievements.length >= 4 ? 4 : 3}">
        ${p.achievements.map((a) => `
          <div style="text-align: center; padding: 8mm 4mm; background: rgba(255,255,255,0.15); border-radius: 14px; backdrop-filter: blur(10px);">
            <div class="stat-value" style="color: white;">${escapeHtml(a.value)}</div>
            <div style="font-size: 10pt; opacity: 0.9; margin-top: 4mm;">${escapeHtml(a.label)}</div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const testimonialsBlock = (p.testimonials && p.testimonials.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">✦ ${escapeHtml(s.testimonials)}</h2>
      <div class="grid-2">
        ${p.testimonials.map((t, i) => {
          const c = i % 2 === 0 ? p.primaryColor : p.accentColor;
          return `
            <div style="padding: 7mm; border-radius: 14px; background: ${c}10; position: relative;">
              <div class="quote-mark" style="color: ${c}; position:absolute; top:2mm; ${p.language === "ar" ? "left" : "right"}:5mm;">"</div>
              <p style="font-size: 11pt; line-height: 1.7; color: #334155; font-style: italic; margin-bottom: 5mm;">"${escapeHtml(t.quote)}"</p>
              <div style="display:flex; align-items:center; gap:3mm;">
                <img src="${t.imageDataUrl || PLACEHOLDER_LOGO}" style="width:11mm; height:11mm; border-radius:50%; object-fit:cover; border: 2px solid ${c};"/>
                <div>
                  <div style="font-weight: 700; color: ${p.secondaryColor}; font-size: 10pt;">${escapeHtml(t.name)}</div>
                  <div style="font-size: 8pt; color: #64748b;">${escapeHtml(t.role)}</div>
                </div>
              </div>
            </div>`;
        }).join("")}
      </div>
    </div>` : "";

  const galleryBlock = (p.galleryImages && p.galleryImages.length > 0) ? `
    <div class="page">
      <h2 class="section-title" style="color: ${p.secondaryColor};">✦ ${escapeHtml(s.gallery)}</h2>
      <div class="grid-2" style="gap: 4mm;">
        ${p.galleryImages.map((g) => `
          <div style="border-radius: 14px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
            <img src="${g.imageDataUrl}" style="width:100%; height:55mm; object-fit:cover;"/>
            ${g.caption ? `<div style="padding:3mm 4mm; font-size:9pt; color:#475569; background:white;">${escapeHtml(g.caption)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const contactBlock = (p.contactEmail || p.contactPhone || p.contactAddress || p.contactWebsite) ? `
    <div class="page" style="background: ${p.secondaryColor}; color: white; position: relative;">
      <div style="position:absolute;top:-30mm;${p.language === "ar" ? "left" : "right"}:-30mm;width:120mm;height:120mm;border-radius:50%;background:${p.primaryColor};opacity:0.3;"></div>
      <div style="position:absolute;bottom:-40mm;${p.language === "ar" ? "right" : "left"}:-40mm;width:140mm;height:140mm;border-radius:50%;background:${p.accentColor};opacity:0.25;"></div>
      <div style="position:relative; padding-top: 30mm;">
        <h2 style="font-size: 32pt; font-weight: 900; margin-bottom: 12mm;">✦ ${escapeHtml(s.contact)}</h2>
        <div style="font-size: 12pt; line-height: 2.2;">
          ${p.contactEmail ? `<div><strong style="display:inline-block;width:30mm;opacity:0.7;">${escapeHtml(s.email)}</strong> ${escapeHtml(p.contactEmail)}</div>` : ""}
          ${p.contactPhone ? `<div><strong style="display:inline-block;width:30mm;opacity:0.7;">${escapeHtml(s.phone)}</strong> ${escapeHtml(p.contactPhone)}</div>` : ""}
          ${p.contactWebsite ? `<div><strong style="display:inline-block;width:30mm;opacity:0.7;">${escapeHtml(s.website)}</strong> ${escapeHtml(p.contactWebsite)}</div>` : ""}
          ${p.contactAddress ? `<div style="margin-top:4mm;"><strong style="display:inline-block;width:30mm;opacity:0.7;vertical-align:top;">${escapeHtml(s.address)}</strong> <span style="display:inline-block;max-width:120mm;">${nl2br(p.contactAddress)}</span></div>` : ""}
        </div>
      </div>
    </div>` : "";

  const partnersBlock = renderPartnersBlock(p, s, { prefix: "✦ " });
  return cover + aboutPage + valuesPage + servicesPage + achievementsBlock + testimonialsBlock + partnersBlock + galleryBlock + contactBlock;
}

// ============== TEMPLATE: MINIMAL ==============
function renderMinimal(p: CompanyProfile, s: Strings): string {
  const name = pickName(p);
  const tagline = pickField(p, p.tagline, p.taglineAr);
  const about = pickField(p, p.about, p.aboutAr);
  const vision = pickField(p, p.vision, p.visionAr);
  const mission = pickField(p, p.mission, p.missionAr);

  const cover = `
    <div class="page cover-page" style="background: white; color: ${p.secondaryColor};">
      <div style="padding: 22mm 20mm 0;">
        ${p.logoDataUrl ? `<img src="${p.logoDataUrl}" style="height: 24mm; max-width: 50mm; object-fit: contain;"/>` : ""}
      </div>
      <div style="padding: 0 20mm; max-width: 170mm;">
        <div style="width: 30mm; height: 2px; background: ${p.primaryColor}; margin-bottom: 8mm;"></div>
        <h1 style="font-size: 40pt; font-weight: 300; letter-spacing: -1px; line-height: 1.05; margin-bottom: 8mm;">${escapeHtml(name)}</h1>
        ${tagline ? `<p style="font-size: 14pt; color: #64748b; font-weight: 300; line-height: 1.4;">${escapeHtml(tagline)}</p>` : ""}
      </div>
      <div style="padding: 0 20mm 22mm; display:flex; justify-content: space-between; font-size: 9pt; color: #94a3b8; letter-spacing: 2px;">
        <span>${escapeHtml(s.cover).toUpperCase()}</span>
        <span>${new Date().getFullYear()}</span>
      </div>
    </div>`;

  const block = (label: string, body: string) => `
    <div style="margin-bottom: 14mm;">
      <div style="display: grid; grid-template-columns: 40mm 1fr; gap: 6mm;">
        <div>
          <div style="font-size:10pt; letter-spacing: 3px; color: ${p.primaryColor}; font-weight: 600;">${escapeHtml(label).toUpperCase()}</div>
        </div>
        <div style="font-size: 11.5pt; line-height: 1.8; color: #334155;">${body}</div>
      </div>
    </div>`;

  const aboutPage = (about || vision || mission) ? `
    <div class="page">
      ${about ? block(s.about, nl2br(about)) : ""}
      <div style="height: 1px; background: #e2e8f0; margin: 6mm 0;"></div>
      ${vision ? block(s.vision, nl2br(vision)) : ""}
      ${mission ? block(s.mission, nl2br(mission)) : ""}
    </div>` : "";

  const valuesPage = (p.coreValues && p.coreValues.length > 0) ? `
    <div class="page">
      <div style="font-size:10pt; letter-spacing: 3px; color: ${p.primaryColor}; font-weight: 600; margin-bottom: 10mm;">${escapeHtml(s.values).toUpperCase()}</div>
      <div style="display: flex; flex-direction: column; gap: 6mm;">
        ${p.coreValues.map((v, i) => `
          <div style="display: grid; grid-template-columns: 14mm 1fr; gap: 6mm; padding-bottom: 6mm; border-bottom: 1px solid #f1f5f9;">
            <div style="font-size: 22pt; font-weight: 300; color: ${p.primaryColor};">${String(i + 1).padStart(2, "0")}</div>
            <div>
              <h3 style="font-size: 13pt; font-weight: 600; color: ${p.secondaryColor}; margin-bottom: 2mm;">${escapeHtml(v.title)}</h3>
              <p style="font-size: 10.5pt; line-height: 1.7; color: #64748b;">${nl2br(v.description)}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const servicesPage = (p.services && p.services.length > 0) ? `
    <div class="page">
      <div style="font-size:10pt; letter-spacing: 3px; color: ${p.primaryColor}; font-weight: 600; margin-bottom: 10mm;">${escapeHtml(s.services).toUpperCase()}</div>
      ${p.services.map((sv) => `
        <div style="display: grid; grid-template-columns: 1fr 50mm; gap: 8mm; margin-bottom: 8mm; padding-bottom: 8mm; border-bottom: 1px solid #f1f5f9;">
          <div>
            <h3 style="font-size: 14pt; font-weight: 600; color: ${p.secondaryColor}; margin-bottom: 3mm;">${escapeHtml(sv.title)}</h3>
            <p style="font-size: 10.5pt; line-height: 1.7; color: #64748b;">${nl2br(sv.description)}</p>
          </div>
          <img src="${sv.imageDataUrl || PLACEHOLDER_IMG}" style="width:100%; height:35mm; object-fit:cover;"/>
        </div>
      `).join("")}
    </div>` : "";

  const achievementsBlock = (p.achievements && p.achievements.length > 0) ? `
    <div class="page">
      <div style="font-size:10pt; letter-spacing: 3px; color: ${p.primaryColor}; font-weight: 600; margin-bottom: 14mm;">${escapeHtml(s.achievements).toUpperCase()}</div>
      <div class="grid-${p.achievements.length >= 4 ? 4 : 3}" style="gap: 10mm;">
        ${p.achievements.map((a) => `
          <div>
            <div style="font-size: 44pt; font-weight: 200; color: ${p.secondaryColor}; line-height: 1;">${escapeHtml(a.value)}</div>
            <div style="height: 1px; background: ${p.primaryColor}; width: 12mm; margin: 4mm 0;"></div>
            <div style="font-size: 10pt; color: #64748b;">${escapeHtml(a.label)}</div>
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const testimonialsBlock = (p.testimonials && p.testimonials.length > 0) ? `
    <div class="page">
      <div style="font-size:10pt; letter-spacing: 3px; color: ${p.primaryColor}; font-weight: 600; margin-bottom: 10mm;">${escapeHtml(s.testimonials).toUpperCase()}</div>
      ${p.testimonials.map((t) => `
        <div style="margin-bottom: 10mm; padding-bottom: 10mm; border-bottom: 1px solid #f1f5f9;">
          <p style="font-size: 13pt; line-height: 1.7; color: ${p.secondaryColor}; font-weight: 300; margin-bottom: 5mm;">"${escapeHtml(t.quote)}"</p>
          <div style="font-size: 10pt; color: #64748b;">— <span style="color: ${p.primaryColor}; font-weight: 600;">${escapeHtml(t.name)}</span>, ${escapeHtml(t.role)}</div>
        </div>
      `).join("")}
    </div>` : "";

  const galleryBlock = (p.galleryImages && p.galleryImages.length > 0) ? `
    <div class="page">
      <div style="font-size:10pt; letter-spacing: 3px; color: ${p.primaryColor}; font-weight: 600; margin-bottom: 10mm;">${escapeHtml(s.gallery).toUpperCase()}</div>
      <div class="grid-2" style="gap: 4mm;">
        ${p.galleryImages.map((g) => `
          <div>
            <img src="${g.imageDataUrl}" style="width:100%; height:55mm; object-fit:cover;"/>
            ${g.caption ? `<div style="padding-top:2mm; font-size:9pt; color:#94a3b8;">${escapeHtml(g.caption)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>` : "";

  const contactBlock = (p.contactEmail || p.contactPhone || p.contactAddress || p.contactWebsite) ? `
    <div class="page">
      <div style="padding-top: 40mm;">
        <div style="width: 30mm; height: 2px; background: ${p.primaryColor}; margin-bottom: 8mm;"></div>
        <h2 style="font-size: 36pt; font-weight: 300; color: ${p.secondaryColor}; margin-bottom: 14mm;">${escapeHtml(s.contact)}</h2>
        <div style="font-size: 12pt; line-height: 2.2; color: #334155;">
          ${p.contactEmail ? `<div><span style="color:#94a3b8;display:inline-block;width:30mm;font-size:10pt;letter-spacing:1px;">${escapeHtml(s.email).toUpperCase()}</span> ${escapeHtml(p.contactEmail)}</div>` : ""}
          ${p.contactPhone ? `<div><span style="color:#94a3b8;display:inline-block;width:30mm;font-size:10pt;letter-spacing:1px;">${escapeHtml(s.phone).toUpperCase()}</span> ${escapeHtml(p.contactPhone)}</div>` : ""}
          ${p.contactWebsite ? `<div><span style="color:#94a3b8;display:inline-block;width:30mm;font-size:10pt;letter-spacing:1px;">${escapeHtml(s.website).toUpperCase()}</span> ${escapeHtml(p.contactWebsite)}</div>` : ""}
          ${p.contactAddress ? `<div style="margin-top:4mm;"><span style="color:#94a3b8;display:inline-block;width:30mm;font-size:10pt;letter-spacing:1px;vertical-align:top;">${escapeHtml(s.address).toUpperCase()}</span> <span style="display:inline-block;max-width:120mm;">${nl2br(p.contactAddress)}</span></div>` : ""}
        </div>
      </div>
    </div>` : "";

  const partnersBlock = renderPartnersBlock(p, s);
  return cover + aboutPage + valuesPage + servicesPage + achievementsBlock + testimonialsBlock + partnersBlock + galleryBlock + contactBlock;
}

function renderBody(p: CompanyProfile, s: Strings): string {
  switch (p.template) {
    case "corporate": return renderCorporate(p, s);
    case "creative": return renderCreative(p, s);
    case "minimal": return renderMinimal(p, s);
    // New professional templates — premium variants built on the four base layouts,
    // each paired with a distinct typographic personality via the font selector.
    case "executive": return renderCorporate(p, s);
    case "elegant": return renderMinimal(p, s);
    case "bold": return renderModern(p, s);
    case "tech": return renderCreative(p, s);
    case "luxury": return renderCorporate(p, s);
    case "monochrome": return renderMinimal(p, s);
    case "geometric": return renderModern(p, s);
    case "neon": return renderCreative(p, s);
    case "editorial": return renderCorporate(p, s);
    case "premium": return renderCorporate(p, s);
    case "vintage": return renderMinimal(p, s);
    case "gradient": return renderModern(p, s);
    case "modern":
    default: return renderModern(p, s);
  }
}

export async function generateCompanyProfilePDF(profile: CompanyProfile): Promise<Buffer> {
  const strings = getStrings(profile.language);
  const html = `<!DOCTYPE html>
<html lang="${profile.language}" dir="${profile.language === "ar" ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(pickName(profile))} — ${escapeHtml(strings.cover)}</title>
  <style>${baseStyles(profile)}</style>
</head>
<body>
  ${renderBody(profile, strings)}
</body>
</html>`;

  // Try up to 2 times — the shared browser instance can go stale between
  // requests, producing "Navigating frame was detached". On failure we close
  // the broken browser so getBrowser() launches a fresh one on retry.
  let lastErr: any;
  for (let attempt = 0; attempt < 2; attempt++) {
    let browser: any;
    let page: any;
    try {
      browser = await getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 30000 });
      try {
        await page.evaluate(() => (document as any).fonts?.ready);
      } catch {}
      const pdf = await page.pdf({
        format: "A4",
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
      if (isStaleBrowser && browser) {
        try { await browser.close(); } catch {}
      }
      if (!isStaleBrowser) break;
    }
  }
  throw lastErr;
}
