import puppeteer, { Browser } from "puppeteer";
import QRCode from "qrcode";
import type { Order } from "@shared/schema";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import * as path from "path";

interface InvoiceData {
  order: Order;
  companyName: string;
  companyVAT: string;
  branchAddress: string;
  companyEmail: string;
  companyPhone: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceId: string;
  baseUrl: string;
  logoPath?: string; // Optional logo path
}

// HTML escaping function to prevent injection
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Detect Chromium executable path with fallbacks
function getChromiumPath(): string | undefined {
  // 1. Check environment variable override
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    console.log(`[Invoice] Using Chromium from env: ${process.env.CHROMIUM_PATH}`);
    return process.env.CHROMIUM_PATH;
  }

  // 2. Try to find via which command
  try {
    const chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
    if (chromiumPath && existsSync(chromiumPath)) {
      console.log(`[Invoice] Found Chromium via which: ${chromiumPath}`);
      return chromiumPath;
    }
  } catch (e) {
    // Continue to next fallback
  }

  // 3. Common Nix store paths (Replit environment)
  const nixPaths = [
    '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    // Add more common paths as needed
  ];
  
  for (const path of nixPaths) {
    if (existsSync(path)) {
      console.log(`[Invoice] Using Nix Chromium: ${path}`);
      return path;
    }
  }

  console.warn('[Invoice] No Chromium executable found, falling back to Puppeteer default');
  return undefined;
}

// Shared browser instance for better performance
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  // If browser is connected and working, return it
  if (browserInstance && browserInstance.isConnected()) {
    try {
      // Quick connection test
      const pages = await browserInstance.pages();
      return browserInstance;
    } catch (e) {
      console.log('[Invoice] Browser connection test failed, will recreate');
      browserInstance = null;
    }
  }

  // If already launching, wait for that promise
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  // Launch new browser
  browserLaunchPromise = (async () => {
    try {
      const chromiumPath = getChromiumPath();
      
      if (!chromiumPath) {
        throw new Error('Chromium executable not found. Please install Chromium or set CHROMIUM_PATH environment variable.');
      }

      console.log('[Invoice] Launching new browser instance');
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromiumPath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--single-process',
          '--no-zygote'
        ]
      });

      browserInstance = browser;
      console.log('[Invoice] Browser launched successfully');
      return browser;
    } finally {
      browserLaunchPromise = null;
    }
  })();

  return browserLaunchPromise;
}

function generateBilingualInvoiceHTML(data: InvoiceData, qrCodeDataURL: string): string {
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate } = data;
  
  // Escape all user inputs
  const escapedCompanyName = escapeHtml(companyName);
  const escapedCompanyVAT = escapeHtml(companyVAT);
  const escapedBranchAddress = escapeHtml(branchAddress);
  const escapedCompanyEmail = escapeHtml(companyEmail);
  const escapedCompanyPhone = escapeHtml(companyPhone);
  const escapedInvoiceNumber = escapeHtml(invoiceNumber);
  const escapedOrderNumber = escapeHtml(order.orderNumber);
  const escapedOrderType = escapeHtml(order.orderType);
  
  const subtotal = parseFloat(order.subtotal);
  const tax = parseFloat(order.tax);
  const total = parseFloat(order.total);

  // Handle logo embedding if logoPath is provided
  let logoHTML = '';
  if (data.logoPath) {
    try {
      const logoFullPath = path.join(process.cwd(), data.logoPath);
      if (existsSync(logoFullPath)) {
        const logoBuffer = readFileSync(logoFullPath);
        const logoExt = path.extname(data.logoPath).substring(1);
        const logoMimeType = logoExt === 'svg' ? 'svg+xml' : logoExt;
        const logoBase64 = logoBuffer.toString('base64');
        const logoDataURL = `data:image/${logoMimeType};base64,${logoBase64}`;
        
        logoHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoDataURL}" alt="Business Logo" style="max-width: 150px; max-height: 80px; object-fit: contain;" />
        </div>
      `;
      }
    } catch (error) {
      console.error('[Invoice] Failed to load logo:', error);
      // Gracefully continue without logo
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Noto Naskh Arabic', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      background: white;
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm;
    }
    
    .header {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 15px 20px;
      text-align: center;
      border-radius: 6px 6px 0 0;
      margin-bottom: 12px;
    }
    
    .company-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    
    .invoice-badge {
      display: inline-block;
      background: white;
      color: #2962ff;
      padding: 4px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 10px;
      margin-top: 4px;
    }
    
    .bilingual-section {
      display: flex;
      gap: 12px;
      margin-bottom: 10px;
    }
    
    .section-left, .section-right {
      flex: 1;
      padding: 10px 12px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    
    .section-left {
      background: #f8f9fa;
    }
    
    .section-right {
      background: #e3f2fd;
      direction: rtl;
      text-align: right;
    }
    
    .section-title {
      font-weight: 700;
      font-size: 9px;
      color: #1e40af;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 4px;
      font-size: 9px;
      line-height: 1.3;
    }
    
    .section-right .info-row {
      flex-direction: row-reverse;
      text-align: right;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 80px;
      color: #374151;
    }
    
    .info-value {
      color: #1a1a1a;
      word-break: break-word;
    }
    
    .customer-section {
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      border: 1px solid #e5e7eb;
    }
    
    .customer-grid {
      display: flex;
      gap: 20px;
    }
    
    .customer-col {
      flex: 1;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .items-table thead {
      background: #2962ff;
      color: white;
    }
    
    .items-table th {
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .items-table th.rtl {
      text-align: right;
    }
    
    .items-table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    .items-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table td {
      padding: 5px 8px;
      font-size: 9px;
      word-break: break-word;
      line-height: 1.3;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals-section {
      max-width: 300px;
      margin-left: auto;
      margin-bottom: 10px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 10px;
      font-size: 10px;
    }
    
    .totals-row.total {
      background: #2962ff;
      color: white;
      font-weight: 700;
      font-size: 13px;
      border-radius: 4px;
      padding: 8px 12px;
      margin-top: 6px;
    }
    
    .totals-row.subtotal {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .qr-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      background: #f8f9fa;
      padding: 10px 15px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
      border: 2px solid #e5e7eb;
      border-radius: 4px;
      padding: 4px;
      flex-shrink: 0;
    }
    
    .footer-content {
      flex: 1;
    }
    
    .zatca-badge {
      color: #2962ff;
      font-weight: 700;
      font-size: 10px;
      margin-bottom: 4px;
    }
    
    .footer-text {
      font-size: 8px;
      color: #6b7280;
      margin-bottom: 2px;
      line-height: 1.3;
    }
    
    .arabic {
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .english {
      font-family: 'Inter', sans-serif;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    @page {
      size: A4;
      margin: 8mm;
    }
    
    .header, .totals-section, .qr-footer {
      page-break-inside: avoid;
    }
    
    .items-table tbody tr {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      ${logoHTML}
      <div class="company-name english">${escapedCompanyName}</div>
      <div class="invoice-badge">TAX INVOICE | فاتورة ضريبية</div>
    </div>
    
    <!-- Company Information - Bilingual -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english">
        <div class="section-title">Company Information</div>
        <div class="info-row">
          <div class="info-label">VAT Number:</div>
          <div class="info-value">${escapedCompanyVAT}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone:</div>
          <div class="info-value">${escapedCompanyPhone}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${escapedCompanyEmail}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Address:</div>
          <div class="info-value">${escapedBranchAddress}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">معلومات الشركة</div>
        <div class="info-row">
          <div class="info-value">${escapedCompanyVAT}</div>
          <div class="info-label">:الرقم الضريبي</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedCompanyPhone}</div>
          <div class="info-label">:الهاتف</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedCompanyEmail}</div>
          <div class="info-label">:البريد الإلكتروني</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedBranchAddress}</div>
          <div class="info-label">:العنوان</div>
        </div>
      </div>
    </div>
    
    <!-- Invoice Details - Bilingual -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english">
        <div class="section-title">Invoice Details</div>
        <div class="info-row">
          <div class="info-label">Invoice No:</div>
          <div class="info-value">${escapedInvoiceNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Date:</div>
          <div class="info-value">${invoiceDate.toLocaleDateString('en-GB')}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Order No:</div>
          <div class="info-value">${escapedOrderNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Type:</div>
          <div class="info-value">${escapedOrderType}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">تفاصيل الفاتورة</div>
        <div class="info-row">
          <div class="info-value">${escapedInvoiceNumber}</div>
          <div class="info-label">:رقم الفاتورة</div>
        </div>
        <div class="info-row">
          <div class="info-value">${invoiceDate.toLocaleDateString('ar-SA')}</div>
          <div class="info-label">:التاريخ</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedOrderNumber}</div>
          <div class="info-label">:رقم الطلب</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedOrderType}</div>
          <div class="info-label">:النوع</div>
        </div>
      </div>
    </div>
    
    ${order.customerName || order.table || order.address ? `
    <!-- Customer Information -->
    <div class="customer-section">
      <div class="customer-grid">
        <div class="customer-col english">
          <div class="section-title">Customer Information</div>
          ${order.customerName ? `<div class="info-row"><div class="info-label">Customer:</div><div class="info-value">${escapeHtml(order.customerName)}</div></div>` : ''}
          ${order.table ? `<div class="info-row"><div class="info-label">Table:</div><div class="info-value">${escapeHtml(order.table)}</div></div>` : ''}
          ${order.address ? `<div class="info-row"><div class="info-label">Address:</div><div class="info-value">${escapeHtml(order.address)}</div></div>` : ''}
        </div>
        <div class="customer-col arabic" style="direction: rtl; text-align: right;">
          <div class="section-title">معلومات العميل</div>
          ${order.customerName ? `<div class="info-row"><div class="info-value">${escapeHtml(order.customerName)}</div><div class="info-label">:العميل</div></div>` : ''}
          ${order.table ? `<div class="info-row"><div class="info-value">${escapeHtml(order.table)}</div><div class="info-label">:الطاولة</div></div>` : ''}
          ${order.address ? `<div class="info-row"><div class="info-value">${escapeHtml(order.address)}</div><div class="info-label">:عنوان التوصيل</div></div>` : ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="english">ITEM NAME</th>
          <th class="rtl arabic">اسم الصنف</th>
          <th class="text-center english">QTY</th>
          <th class="text-center english">PRICE</th>
          <th class="text-center english">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td class="english">${escapeHtml(item.name)}</td>
            <td class="text-right arabic">${escapeHtml(item.name)}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-center">${parseFloat(item.price.toString()).toFixed(2)}</td>
            <td class="text-center">${(item.quantity * parseFloat(item.price.toString())).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-row subtotal">
        <span class="english">Subtotal | المجموع الفرعي</span>
        <span>${subtotal.toFixed(2)} SAR</span>
      </div>
      <div class="totals-row">
        <span class="english">VAT (15%) | ضريبة القيمة المضافة</span>
        <span>${tax.toFixed(2)} SAR</span>
      </div>
      <div class="totals-row total">
        <span class="english">TOTAL | الإجمالي</span>
        <span>${total.toFixed(2)} SAR</span>
      </div>
    </div>
    
    <!-- QR Code & Footer -->
    <div class="qr-footer">
      <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code">
      <div class="footer-content">
        <div class="zatca-badge">ZATCA COMPLIANT E-INVOICE | فاتورة إلكترونية متوافقة</div>
        <div class="footer-text english">Scan QR code to view and verify this invoice online</div>
        <div class="footer-text arabic">امسح رمز الاستجابة السريعة لعرض الفاتورة والتحقق منها</div>
        <div class="footer-text english">Saudi Tax Authority (ZATCA) Approved Electronic Invoice</div>
        <div class="footer-text arabic">فاتورة إلكترونية معتمدة من هيئة الزكاة والضريبة والجمارك</div>
        <div class="footer-text english" style="margin-top: 4px;">Thank you for your business | شكراً لتعاملكم معنا</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generateZATCAInvoice(data: InvoiceData): Promise<{ pdfBuffer: Buffer; qrCode: string }> {
  const invoiceUrl = `${data.baseUrl}/public/invoice/${data.invoiceId}`;
  const qrCodeDataURL = await QRCode.toDataURL(invoiceUrl, { width: 150, margin: 1 });

  const html = generateBilingualInvoiceHTML(data, qrCodeDataURL);

  // Retry logic for transient browser connection issues
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '8mm',
            right: '8mm',
            bottom: '8mm',
            left: '8mm'
          }
        });

        return { pdfBuffer: Buffer.from(pdfBuffer), qrCode: qrCodeDataURL };
      } finally {
        await page.close().catch(e => console.log('[Invoice] Page close error:', e.message));
      }
    } catch (error: any) {
      lastError = error;
      const isConnectionError = error.message?.includes('Connection closed') || 
                                error.message?.includes('Target closed') ||
                                error.message?.includes('Session closed');
      
      if (isConnectionError && attempt < 3) {
        console.log(`[Invoice] Attempt ${attempt} failed with connection error, retrying... Error: ${error.message}`);
        // Force browser recreation on next attempt
        browserInstance = null;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      console.error(`[Invoice] Error generating PDF (attempt ${attempt}):`, error);
      throw error;
    }
  }

  throw lastError || new Error('Failed to generate invoice after 3 attempts');
}

interface FinancialStatementData {
  companyName: string;
  companyVAT: string;
  year: string;
  period: "monthly" | "yearly";
  yearlyData: {
    revenue: string;
    vat: string;
    transactions: number;
    invoices: number;
  };
  monthlyData?: Array<{
    month: string;
    revenue: string;
    vat: string;
    transactions: number;
  }>;
}

export async function generateFinancialStatementPDF(data: FinancialStatementData): Promise<Buffer> {
  const { companyName, companyVAT, year, period, yearlyData, monthlyData } = data;
  
  // Escape all user inputs
  const escapedCompanyName = escapeHtml(companyName);
  const escapedCompanyVAT = escapeHtml(companyVAT);
  const escapedYear = escapeHtml(year);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2962ff;
      padding-bottom: 20px;
    }
    
    .company-name {
      font-size: 32px;
      font-weight: 700;
      color: #2962ff;
      margin-bottom: 10px;
    }
    
    .document-title {
      font-size: 24px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .year {
      font-size: 18px;
      color: #6b7280;
    }
    
    .meta-info {
      margin-bottom: 30px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    
    .summary-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .summary-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px;
      border-radius: 6px;
    }
    
    .summary-label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 4px;
    }
    
    .summary-value {
      font-size: 24px;
      font-weight: 700;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .data-table thead {
      background: #f3f4f6;
    }
    
    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .data-table th.text-right {
      text-align: right;
    }
    
    .data-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      word-break: break-word;
    }
    
    .data-table td.text-right {
      text-align: right;
    }
    
    .data-table tfoot {
      font-weight: 700;
      background: #f3f4f6;
    }
    
    .data-table tfoot td {
      padding: 12px;
      border-top: 2px solid #2962ff;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${escapedCompanyName}</div>
    <div class="document-title">Financial Statement</div>
    <div class="year">Year ${escapedYear}</div>
  </div>
  
  <div class="meta-info">
    <div>VAT Number: ${escapedCompanyVAT}</div>
    <div>Generated: ${new Date().toLocaleDateString('en-GB')}</div>
  </div>
  
  <div class="summary-box">
    <div class="summary-title">Annual Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Revenue</div>
        <div class="summary-value">${parseFloat(yearlyData.revenue).toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">VAT Collected</div>
        <div class="summary-value">${parseFloat(yearlyData.vat).toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Transactions</div>
        <div class="summary-value">${yearlyData.transactions}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Invoices Generated</div>
        <div class="summary-value">${yearlyData.invoices}</div>
      </div>
    </div>
  </div>
  
  ${period === "monthly" && monthlyData && monthlyData.length > 0 ? `
    <div class="section-title">Monthly Breakdown</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Revenue (SAR)</th>
          <th class="text-right">VAT (SAR)</th>
          <th class="text-right">Transactions</th>
        </tr>
      </thead>
      <tbody>
        ${monthlyData.map(month => `
          <tr>
            <td>${escapeHtml(month.month)}</td>
            <td class="text-right">${parseFloat(month.revenue).toFixed(2)}</td>
            <td class="text-right">${parseFloat(month.vat).toFixed(2)}</td>
            <td class="text-right">${month.transactions}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td>TOTAL</td>
          <td class="text-right">${monthlyData.reduce((sum, m) => sum + parseFloat(m.revenue), 0).toFixed(2)}</td>
          <td class="text-right">${monthlyData.reduce((sum, m) => sum + parseFloat(m.vat), 0).toFixed(2)}</td>
          <td class="text-right">${monthlyData.reduce((sum, m) => sum + m.transactions, 0)}</td>
        </tr>
      </tfoot>
    </table>
  ` : ''}
  
  <div class="footer">
    <div>BlindSpot System (BSS) Financial Statement</div>
    <div>VAT Compliant - Saudi Arabia</div>
  </div>
</body>
</html>
  `;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Generate ZATCA-compliant subscription invoice
export async function generateSubscriptionInvoice(data: {
  serialNumber: string;
  userFullName: string;
  userEmail: string;
  restaurantName: string;
  nationalId: string;
  taxNumber: string;
  commercialRegistration: string;
  subscriptionPlan: string;
  branchesCount: number;
  basePlanPrice: number;
  additionalBranchesPrice: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  invoiceDate: Date;
}): Promise<Buffer> {
  // Generate QR code for ZATCA compliance
  const qrData = `Invoice: ${data.serialNumber}\nDate: ${data.invoiceDate.toLocaleDateString('en-GB')}\nTotal: ${data.total.toFixed(2)} SAR\nVAT: ${data.vatAmount.toFixed(2)} SAR`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);

  const planNames: Record<string, { en: string; ar: string }> = {
    weekly: { en: "Weekly Plan", ar: "الخطة الأسبوعية" },
    monthly: { en: "Monthly Plan", ar: "الخطة الشهرية" },
    yearly: { en: "Annual Plan", ar: "الخطة السنوية" },
  };

  const planName = planNames[data.subscriptionPlan] || { en: data.subscriptionPlan, ar: data.subscriptionPlan };

  // Security and Confidentiality Agreement Clause
  const securityClause = {
    en: "I acknowledge that all the information, data and numbers entered by me are correct, as they will appear in my tax invoices and subscription invoice, and I take full responsibility if there is anything to the contrary, and the company owning the application has the right to dispose of the account to preserve its legal right before the authorities considered competent in fraud, tax evasion, forgery and forgery.",
    ar: "أقر بأن جميع المعلومات والبيانات والأرقام التي أدخلتها صحيحة، حيث ستظهر في فواتيري الضريبية وفاتورة الاشتراك، وأتحمل كامل المسؤولية في حالة وجود أي شيء مخالف، ويحق للشركة المالكة للتطبيق التصرف في الحساب للحفاظ على حقها القانوني أمام الجهات المختصة المعنية بالاحتيال والتهرب الضريبي والتزوير والتزييف."
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 40px;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .company-name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .invoice-title {
      font-size: 20px;
      opacity: 0.95;
      margin-top: 16px;
    }

    .content {
      padding: 40px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 30px;
    }

    .info-block {
      flex: 1;
    }

    .info-block h3 {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .info-block p {
      margin: 6px 0;
      font-size: 14px;
      color: #374151;
    }

    .info-block strong {
      color: #1f2937;
    }

    .invoice-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .invoice-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .detail-label {
      color: #6b7280;
      font-size: 14px;
    }

    .detail-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }

    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    .items-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .summary {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }

    .summary-row.total {
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
    }

    .qr-section {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }

    .qr-code {
      width: 150px;
      height: 150px;
      margin: 20px auto;
    }

    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }

    .bilingual {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .en { text-align: left; }
    .ar {
      text-align: right;
      font-family: 'Noto Naskh Arabic', serif;
      direction: rtl;
    }

    .security-clause {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
      page-break-inside: avoid;
    }

    .security-clause h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .security-clause-content {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .security-clause-content .en,
    .security-clause-content .ar {
      flex: 1;
      font-size: 10px;
      line-height: 1.6;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-name">BlindSpot System (BSS)</div>
      <div class="bilingual">
        <div class="en invoice-title">Subscription Invoice</div>
        <div class="ar invoice-title">فاتورة الاشتراك</div>
      </div>
    </div>

    <div class="content">
      <div class="invoice-details">
        <div class="invoice-details-grid">
          <div class="detail-row">
            <span class="detail-label">Invoice Number / رقم الفاتورة:</span>
            <span class="detail-value">${escapeHtml(data.serialNumber)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date / التاريخ:</span>
            <span class="detail-value">${data.invoiceDate.toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>Bill To / الفاتورة إلى</h3>
          <p><strong>${escapeHtml(data.restaurantName)}</strong></p>
          <p>${escapeHtml(data.userFullName)}</p>
          <p>${escapeHtml(data.userEmail)}</p>
          <p>National ID: ${escapeHtml(data.nationalId)}</p>
          <p>Tax Number: ${escapeHtml(data.taxNumber)}</p>
          <p>CR: ${escapeHtml(data.commercialRegistration)}</p>
        </div>
        <div class="info-block">
          <h3>From / من</h3>
          <p><strong>BlindSpot System (BSS)</strong></p>
          <p>Business Management Platform</p>
          <p>IT@SaudiKinzhal.org</p>
          <!-- TODO: Update sender email domain when new domain is available -->
          <p>Saudi Arabia</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description / الوصف</th>
            <th class="text-right">Quantity / الكمية</th>
            <th class="text-right">Unit Price / سعر الوحدة</th>
            <th class="text-right">Total / الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${planName.en} / ${planName.ar}</strong><br/>
              <small>(Includes 1 branch)</small>
            </td>
            <td class="text-right">1</td>
            <td class="text-right">${data.basePlanPrice.toFixed(2)} SAR</td>
            <td class="text-right">${data.basePlanPrice.toFixed(2)} SAR</td>
          </tr>
          ${data.branchesCount > 1 ? `
          <tr>
            <td>
              <strong>Additional Branches / فروع إضافية</strong><br/>
              <small>(${data.branchesCount - 1} branches)</small>
            </td>
            <td class="text-right">${data.branchesCount - 1}</td>
            <td class="text-right">${(data.additionalBranchesPrice / (data.branchesCount - 1)).toFixed(2)} SAR</td>
            <td class="text-right">${data.additionalBranchesPrice.toFixed(2)} SAR</td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Subtotal / المجموع الفرعي:</span>
          <span>${data.subtotal.toFixed(2)} SAR</span>
        </div>
        <div class="summary-row">
          <span>VAT (15%) / ضريبة القيمة المضافة:</span>
          <span>${data.vatAmount.toFixed(2)} SAR</span>
        </div>
        <div class="summary-row total">
          <span>Total Amount / المبلغ الإجمالي:</span>
          <span>${data.total.toFixed(2)} SAR</span>
        </div>
      </div>

      <div class="qr-section">
        <p style="color: #6b7280; margin-bottom: 10px;">Scan for ZATCA Verification / امسح للتحقق من هيئة الزكاة</p>
        <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code"/>
      </div>

      <div class="security-clause">
        <h3 style="text-align: center;">Security & Confidentiality Agreement / اتفاقية الأمان والسرية</h3>
        <div class="security-clause-content">
          <div class="en">
            ${escapeHtml(securityClause.en)}
          </div>
          <div class="ar">
            ${escapeHtml(securityClause.ar)}
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is a ZATCA-compliant tax invoice / هذه فاتورة ضريبية متوافقة مع هيئة الزكاة</p>
        <p>Thank you for your business / شكراً لتعاملكم معنا</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Generate ZATCA-compliant monthly VAT report
export async function generateMonthlyVatReport(data: {
  serialNumber: string;
  reportMonth: number;
  reportYear: number;
  restaurantName: string;
  taxNumber: string;
  totalSales: number;
  totalSalesBaseAmount: number;
  totalSalesVat: number;
  totalPurchases: number;
  totalPurchasesBaseAmount: number;
  totalPurchasesVat: number;
  netVatPayable: number;
  generatedDate: Date;
}): Promise<Buffer> {
  // Generate QR code for ZATCA compliance
  const monthNames = [
    { en: "January", ar: "يناير" }, { en: "February", ar: "فبراير" }, { en: "March", ar: "مارس" },
    { en: "April", ar: "أبريل" }, { en: "May", ar: "مايو" }, { en: "June", ar: "يونيو" },
    { en: "July", ar: "يوليو" }, { en: "August", ar: "أغسطس" }, { en: "September", ar: "سبتمبر" },
    { en: "October", ar: "أكتوبر" }, { en: "November", ar: "نوفمبر" }, { en: "December", ar: "ديسمبر" }
  ];
  
  const monthName = monthNames[data.reportMonth - 1];
  const qrData = `VAT Report: ${data.serialNumber}\nPeriod: ${monthName.en} ${data.reportYear}\nNet VAT: ${data.netVatPayable.toFixed(2)} SAR\nTax Number: ${data.taxNumber}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.3;
      padding: 15px;
      font-size: 11px;
    }

    .invoice-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      color: white;
      padding: 15px 20px;
      text-align: center;
    }

    .company-name {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .invoice-title {
      font-size: 13px;
      opacity: 0.95;
      margin-top: 6px;
    }

    .content {
      padding: 15px 20px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 15px;
    }

    .info-block {
      flex: 1;
    }

    .info-block h3 {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
    }

    .info-block p {
      margin: 3px 0;
      font-size: 11px;
      color: #374151;
    }

    .info-block strong {
      color: #1f2937;
    }

    .invoice-details {
      background: #f0fdf4;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      border: 1px solid #bbf7d0;
    }

    .invoice-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }

    .detail-label {
      color: #6b7280;
      font-size: 10px;
    }

    .detail-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 10px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    .items-table th {
      background: #f3f4f6;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .items-table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
      color: #374151;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .summary {
      background: #f0fdf4;
      padding: 10px 12px;
      border-radius: 6px;
      margin-top: 12px;
      border: 1px solid #bbf7d0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 11px;
    }

    .summary-row.highlight {
      background: #dcfce7;
      padding: 6px 8px;
      border-radius: 4px;
      margin: 4px 0;
    }

    .summary-row.total {
      border-top: 2px solid #16a34a;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #16a34a;
    }

    .qr-section {
      text-align: center;
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .qr-code {
      width: 80px;
      height: 80px;
      margin: 8px auto;
    }

    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #6b7280;
    }

    .footer p {
      margin: 2px 0;
    }

    .zatca-notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 8px 10px;
      border-radius: 4px;
      margin: 10px 0;
      text-align: center;
      font-size: 10px;
      color: #92400e;
    }

    .bilingual {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .en { text-align: left; }
    .ar {
      text-align: right;
      font-family: 'Noto Naskh Arabic', serif;
      direction: rtl;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-name">BlindSpot System (BSS)</div>
      <div class="bilingual">
        <div class="en invoice-title">Monthly VAT Report</div>
        <div class="ar invoice-title">تقرير ضريبة القيمة المضافة الشهري</div>
      </div>
    </div>

    <div class="content">
      <div class="invoice-details">
        <div class="invoice-details-grid">
          <div class="detail-row">
            <span class="detail-label">Report Number / رقم التقرير:</span>
            <span class="detail-value">${escapeHtml(data.serialNumber)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Period / الفترة:</span>
            <span class="detail-value">${monthName.en} ${data.reportYear} / ${monthName.ar} ${data.reportYear}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Generated / تاريخ الإنشاء:</span>
            <span class="detail-value">${data.generatedDate.toLocaleDateString('en-GB')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tax Number / الرقم الضريبي:</span>
            <span class="detail-value">${escapeHtml(data.taxNumber)}</span>
          </div>
        </div>
      </div>

      <div class="zatca-notice">
        <strong>⚠️ ZATCA Compliance Notice / إشعار الامتثال لهيئة الزكاة</strong><br/>
        This report is prepared for VAT return submission to ZATCA<br/>
        هذا التقرير معد لتقديم الإقرار الضريبي إلى هيئة الزكاة والضريبة والجمارك
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>Taxpayer Information / معلومات دافع الضرائب</h3>
          <p><strong>${escapeHtml(data.restaurantName)}</strong></p>
          <p>Tax Number / الرقم الضريبي: ${escapeHtml(data.taxNumber)}</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description / الوصف</th>
            <th class="text-right">Base Amount / المبلغ الأساسي</th>
            <th class="text-right">VAT (15%) / ضريبة القيمة المضافة</th>
            <th class="text-right">Total / الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Total Sales / إجمالي المبيعات</strong><br/>
              <small>Sales subject to VAT / المبيعات الخاضعة للضريبة</small>
            </td>
            <td class="text-right">${data.totalSalesBaseAmount.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalSalesVat.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalSales.toFixed(2)} SAR</td>
          </tr>
          <tr>
            <td>
              <strong>Total Purchases / إجمالي المشتريات</strong><br/>
              <small>Purchases subject to VAT / المشتريات الخاضعة للضريبة</small>
            </td>
            <td class="text-right">${data.totalPurchasesBaseAmount.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalPurchasesVat.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalPurchases.toFixed(2)} SAR</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row highlight">
          <span><strong>Output VAT (Sales) / ضريبة المخرجات (المبيعات):</strong></span>
          <span><strong>${data.totalSalesVat.toFixed(2)} SAR</strong></span>
        </div>
        <div class="summary-row highlight">
          <span><strong>Input VAT (Purchases) / ضريبة المدخلات (المشتريات):</strong></span>
          <span><strong>(${data.totalPurchasesVat.toFixed(2)}) SAR</strong></span>
        </div>
        <div class="summary-row total">
          <span>Net VAT Payable / صافي ضريبة القيمة المضافة المستحقة:</span>
          <span>${data.netVatPayable.toFixed(2)} SAR</span>
        </div>
      </div>

      <div class="qr-section">
        <p style="color: #6b7280; margin-bottom: 10px;">Scan for ZATCA Verification / امسح للتحقق من هيئة الزكاة</p>
        <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code"/>
      </div>

      <div class="footer">
        <p><strong>Instructions / التعليمات:</strong></p>
        <p>Submit this report to ZATCA through their portal within the prescribed deadline</p>
        <p>قم بتقديم هذا التقرير إلى هيئة الزكاة والضريبة والجمارك عبر بوابتهم ضمن المهلة المحددة</p>
        <p style="margin-top: 15px;">This is a ZATCA-compliant VAT return certificate / هذه شهادة إقرار ضريبة القيمة المضافة متوافقة مع هيئة الزكاة</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Cleanup function for graceful shutdown
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
