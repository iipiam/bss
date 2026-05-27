// Bilingual EN/AR PDF generators for property management documents.
import puppeteer from "puppeteer";
import QRCode from "qrcode";

const SAR = (halalas: number) =>
  (Number(halalas || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let browserInstance: any = null;
async function getBrowser() {
  if (browserInstance) {
    try { await browserInstance.version(); return browserInstance; } catch { browserInstance = null; }
  }
  const opts: any = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"],
  };
  const fs = await import("fs");
  const { execSync } = await import("child_process");
  const candidates: string[] = [];
  if (process.env.PUPPETEER_EXECUTABLE_PATH) candidates.push(process.env.PUPPETEER_EXECUTABLE_PATH);
  if (process.env.CHROMIUM_PATH) candidates.push(process.env.CHROMIUM_PATH);
  try {
    const found = execSync("which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null", { encoding: "utf8" }).trim();
    if (found) candidates.push(found);
  } catch {}
  candidates.push("/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome");
  for (const p of candidates) {
    try { if (p && fs.existsSync(p)) { opts.executablePath = p; break; } } catch {}
  }
  browserInstance = await puppeteer.launch(opts);
  return browserInstance;
}

async function renderPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    return Buffer.from(pdf);
  } finally {
    try { await page.close(); } catch {}
  }
}

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica', Arial, sans-serif; color: #111827; font-size: 12px; line-height: 1.4; margin: 0; padding: 0; }
  .arabic { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
  h1, h2, h3 { margin: 0 0 8px; }
  h1 { font-size: 22px; }
  h2 { font-size: 16px; color: #1f2937; }
  h3 { font-size: 13px; color: #374151; }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #1e3a8a; margin-bottom: 16px; }
  .hdr .brand { font-weight: 700; font-size: 20px; color: #1e3a8a; }
  .hdr .sub { color: #6b7280; font-size: 11px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
  th { background: #1e3a8a; color: white; font-weight: 600; font-size: 11px; }
  tfoot td { font-weight: 700; background: #f3f4f6; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px dashed #d1d5db; color: #6b7280; font-size: 10px; text-align: center; }
  .label { color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .val { font-weight: 600; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; }
  .qr { text-align: center; }
  .qr img { width: 110px; height: 110px; }
  .bilingual { display: flex; justify-content: space-between; gap: 10px; }
  .sig { margin-top: 30px; display: flex; justify-content: space-between; }
  .sig .block { width: 45%; }
  .sig .line { border-top: 1px solid #111; margin-top: 40px; padding-top: 4px; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-overdue { background: #fee2e2; color: #991b1b; }
`;

function pageWrap(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title><style>${BASE_CSS}</style></head><body>${body}</body></html>`;
}

function brandHeader(companyName: string, companyNameAr: string, taxNumber?: string) {
  return `
    <div class="hdr">
      <div>
        <div class="brand">${companyName}</div>
        <div class="arabic brand">${companyNameAr || companyName}</div>
        ${taxNumber ? `<div class="sub">VAT / الرقم الضريبي: ${taxNumber}</div>` : ""}
      </div>
      <div class="sub" style="text-align:right">
        <div>BlindSpot System</div>
        <div>Property Management</div>
        <div class="arabic">إدارة العقارات</div>
      </div>
    </div>`;
}

export async function generateInvoicePdf(opts: {
  invoice: any; contract: any; unit: any; tenant: any; property: any;
  companyName: string; companyNameAr?: string; taxNumber?: string;
}): Promise<Buffer> {
  const { invoice, contract, unit, tenant, property, companyName, companyNameAr, taxNumber } = opts;
  const balance = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
  const qrPayload = JSON.stringify({
    invoice: invoice.invoiceNumber, total: SAR(invoice.totalAmount), date: invoice.issueDate, tenant: tenant.fullName,
  });
  const qr = await QRCode.toDataURL(qrPayload, { width: 200 });
  const statusBadge = invoice.status === "paid" ? "badge-paid" : invoice.status === "overdue" ? "badge-overdue" : "badge-pending";
  const body = `
    ${brandHeader(companyName, companyNameAr || companyName, taxNumber)}
    <div class="bilingual">
      <h1>Rental Invoice</h1>
      <h1 class="arabic">فاتورة إيجار</h1>
    </div>
    <div class="meta-grid">
      <div class="box">
        <div class="label">Invoice Number / رقم الفاتورة</div>
        <div class="val">${invoice.invoiceNumber}</div>
        <div class="label" style="margin-top:6px">Issue Date / تاريخ الإصدار</div>
        <div class="val">${invoice.issueDate}</div>
        <div class="label" style="margin-top:6px">Due Date / تاريخ الاستحقاق</div>
        <div class="val">${invoice.dueDate}</div>
        <div class="label" style="margin-top:6px">Status / الحالة</div>
        <div><span class="badge ${statusBadge}">${(invoice.status || "").toUpperCase()}</span></div>
      </div>
      <div class="box">
        <div class="label">Tenant / المستأجر</div>
        <div class="val">${tenant.fullName}</div>
        ${tenant.phone ? `<div>${tenant.phone}</div>` : ""}
        ${tenant.email ? `<div>${tenant.email}</div>` : ""}
        <div class="label" style="margin-top:6px">Property / العقار</div>
        <div class="val">${property?.name || ""} — Unit ${unit?.unitNumber || ""}</div>
        ${property?.address ? `<div>${property.address}</div>` : ""}
      </div>
    </div>
    <table>
      <thead><tr>
        <th>Description / الوصف</th>
        <th style="width:120px;text-align:right">Amount (ر.س)</th>
      </tr></thead>
      <tbody>
        <tr>
          <td>${invoice.type === "rent" ? "Rent" : invoice.type === "deposit" ? "Security Deposit" : invoice.type}
            ${invoice.notes ? `<div class="sub">${invoice.notes}</div>` : ""}</td>
          <td style="text-align:right">${SAR(invoice.amount)}</td>
        </tr>
        ${invoice.taxAmount ? `<tr><td>VAT 15% / ضريبة القيمة المضافة</td><td style="text-align:right">${SAR(invoice.taxAmount)}</td></tr>` : ""}
      </tbody>
      <tfoot>
        <tr><td>Total / المجموع</td><td style="text-align:right">${SAR(invoice.totalAmount)}</td></tr>
        ${invoice.amountPaid ? `<tr><td>Paid / المدفوع</td><td style="text-align:right">${SAR(invoice.amountPaid)}</td></tr>` : ""}
        <tr><td>Balance Due / المستحق</td><td style="text-align:right">${SAR(balance)}</td></tr>
      </tfoot>
    </table>
    <div class="meta-grid" style="margin-top:20px">
      <div></div>
      <div class="qr"><img src="${qr}"/><div class="sub">Scan to verify</div></div>
    </div>
    <div class="footer">Thank you for your business · شكراً لتعاملكم معنا</div>
  `;
  return renderPdf(pageWrap(`Invoice ${invoice.invoiceNumber}`, body));
}

export async function generateReceiptPdf(opts: {
  payment: any; invoice: any; tenant: any; companyName: string; companyNameAr?: string; taxNumber?: string;
}): Promise<Buffer> {
  const { payment, invoice, tenant, companyName, companyNameAr, taxNumber } = opts;
  const body = `
    ${brandHeader(companyName, companyNameAr || companyName, taxNumber)}
    <div class="bilingual"><h1>Payment Receipt</h1><h1 class="arabic">إيصال دفع</h1></div>
    <div class="meta-grid">
      <div class="box">
        <div class="label">Receipt Date / تاريخ الإيصال</div><div class="val">${payment.paymentDate}</div>
        <div class="label" style="margin-top:6px">Method / طريقة الدفع</div><div class="val">${payment.method}</div>
        ${payment.referenceNumber ? `<div class="label" style="margin-top:6px">Reference / المرجع</div><div class="val">${payment.referenceNumber}</div>` : ""}
      </div>
      <div class="box">
        <div class="label">Tenant / المستأجر</div><div class="val">${tenant.fullName}</div>
        <div class="label" style="margin-top:6px">For Invoice / للفاتورة</div><div class="val">${invoice.invoiceNumber}</div>
      </div>
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right;width:120px">Amount (ر.س)</th></tr></thead>
      <tbody><tr><td>Payment for invoice ${invoice.invoiceNumber}</td><td style="text-align:right">${SAR(payment.amountPaid)}</td></tr></tbody>
      <tfoot><tr><td>Total Received / إجمالي المستلم</td><td style="text-align:right">${SAR(payment.amountPaid)}</td></tr></tfoot>
    </table>
    <div class="footer">Receipt generated by BlindSpot System</div>`;
  return renderPdf(pageWrap(`Receipt ${payment.id.slice(0, 8)}`, body));
}

export async function generateContractPdf(opts: {
  contract: any; unit: any; tenant: any; property: any;
  companyName: string; companyNameAr?: string; taxNumber?: string;
}): Promise<Buffer> {
  const { contract, unit, tenant, property, companyName, companyNameAr, taxNumber } = opts;
  const body = `
    ${brandHeader(companyName, companyNameAr || companyName, taxNumber)}
    <div class="bilingual"><h1>Rental Contract</h1><h1 class="arabic">عقد إيجار</h1></div>
    <div class="meta-grid">
      <div class="box">
        <div class="label">Contract # / رقم العقد</div><div class="val">${contract.contractNumber || contract.id.slice(0, 8)}</div>
        <div class="label" style="margin-top:6px">Start / البداية</div><div class="val">${contract.startDate}</div>
        <div class="label" style="margin-top:6px">End / النهاية</div><div class="val">${contract.endDate}</div>
        <div class="label" style="margin-top:6px">Duration / المدة</div><div class="val">${contract.durationMonths} months / شهور</div>
      </div>
      <div class="box">
        <div class="label">Monthly Rent / الإيجار الشهري</div><div class="val">${SAR(contract.monthlyRent)} ر.س</div>
        <div class="label" style="margin-top:6px">Total Value / القيمة الإجمالية</div><div class="val">${SAR(contract.totalValue)} ر.س</div>
        <div class="label" style="margin-top:6px">Security Deposit / التأمين</div><div class="val">${SAR(contract.securityDeposit)} ر.س</div>
        <div class="label" style="margin-top:6px">Payment Frequency / دورية الدفع</div><div class="val">${contract.paymentFrequency}</div>
      </div>
    </div>
    <div class="box" style="margin-top:14px">
      <h3>Property & Unit / العقار والوحدة</h3>
      <div class="row"><span class="label">Property</span><span class="val">${property?.name || ""}</span></div>
      <div class="row"><span class="label">Address</span><span class="val">${property?.address || ""}</span></div>
      <div class="row"><span class="label">Unit</span><span class="val">${unit?.unitNumber || ""}</span></div>
    </div>
    <div class="box" style="margin-top:10px">
      <h3>Tenant / المستأجر</h3>
      <div class="row"><span class="label">Name</span><span class="val">${tenant.fullName}</span></div>
      ${tenant.idNumber ? `<div class="row"><span class="label">ID</span><span class="val">${tenant.idNumber} (${tenant.idType})</span></div>` : ""}
      ${tenant.phone ? `<div class="row"><span class="label">Phone</span><span class="val">${tenant.phone}</span></div>` : ""}
      ${tenant.email ? `<div class="row"><span class="label">Email</span><span class="val">${tenant.email}</span></div>` : ""}
    </div>
    ${contract.terms ? `<div class="box" style="margin-top:10px"><h3>Terms / الشروط</h3><div style="white-space:pre-wrap">${contract.terms}</div></div>` : ""}
    <div class="sig">
      <div class="block"><div class="line">Landlord Signature / توقيع المؤجر</div></div>
      <div class="block"><div class="line">Tenant Signature / توقيع المستأجر</div></div>
    </div>
    <div class="footer">Contract generated by BlindSpot System</div>`;
  return renderPdf(pageWrap(`Contract ${contract.contractNumber || contract.id.slice(0, 8)}`, body));
}

export async function generateReportPdf(opts: {
  title: string; titleAr: string; rows: { label: string; value: string }[]; tableRows?: { headers: string[]; data: string[][] };
  companyName: string;
}): Promise<Buffer> {
  const { title, titleAr, rows, tableRows, companyName } = opts;
  const body = `
    ${brandHeader(companyName, companyName)}
    <div class="bilingual"><h1>${title}</h1><h1 class="arabic">${titleAr}</h1></div>
    <div class="meta-grid">
      <div class="box">${rows.map((r) => `<div class="row"><span class="label">${r.label}</span><span class="val">${r.value}</span></div>`).join("")}</div>
      <div class="box"><div class="label">Generated / تم الإنشاء</div><div class="val">${new Date().toISOString().slice(0, 10)}</div></div>
    </div>
    ${tableRows ? `<table><thead><tr>${tableRows.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows.data.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>` : ""}
    <div class="footer">Report generated by BlindSpot System</div>`;
  return renderPdf(pageWrap(title, body));
}
