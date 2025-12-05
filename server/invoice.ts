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

export async function getBrowser(): Promise<Browser> {
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
  // Optional business info (uses defaults if not provided)
  businessInfo?: {
    companyNameEn?: string | null;
    companyNameAr?: string | null;
    vatNumber?: string | null;
    crNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    addressEn?: string | null;
    addressAr?: string | null;
    city?: string | null;
    postalCode?: string | null;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankIban?: string | null;
  } | null;
}): Promise<Buffer> {
  // Extract business info with defaults for backward compatibility
  const bi = data.businessInfo || {};
  const companyNameEn = bi.companyNameEn || "BlindSpot System (BSS)";
  const companyNameAr = bi.companyNameAr || "نظام بلايند سبوت";
  const companyEmail = bi.email || "IT@SaudiKinzhal.org";
  const companyPhone = bi.phone || "";
  const companyWebsite = bi.website || "https://kinbss.com";
  const companyAddressEn = bi.addressEn || "Saudi Arabia";
  const companyAddressAr = bi.addressAr || "المملكة العربية السعودية";
  const companyCity = bi.city || "";
  const companyPostalCode = bi.postalCode || "";
  const companyVatNumber = bi.vatNumber || "";
  const companyCrNumber = bi.crNumber || "";
  const bankName = bi.bankName || "";
  const bankAccountName = bi.bankAccountName || "";
  const bankAccountNumber = bi.bankAccountNumber || "";
  const bankIban = bi.bankIban || "";

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

    .refund-policy {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }

    .refund-policy h3 {
      font-size: 14px;
      font-weight: 700;
      color: #b45309;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .refund-policy-content {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .refund-policy-content .en,
    .refund-policy-content .ar {
      flex: 1;
      font-size: 10px;
      line-height: 1.7;
      color: #78350f;
    }

    .refund-policy-content p {
      margin-bottom: 8px;
    }

    .refund-policy-content p:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-name">${escapeHtml(companyNameEn)}</div>
      ${companyNameAr && companyNameAr !== companyNameEn ? `<div class="company-name-ar" style="font-family: 'Noto Naskh Arabic', serif; font-size: 24px; direction: rtl; opacity: 0.9; margin-top: 4px;">${escapeHtml(companyNameAr)}</div>` : ''}
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
          <p><strong>${escapeHtml(companyNameEn)}</strong></p>
          ${companyNameAr && companyNameAr !== companyNameEn ? `<p style="font-family: 'Noto Naskh Arabic', serif; direction: rtl;"><strong>${escapeHtml(companyNameAr)}</strong></p>` : ''}
          <p>Business Management Platform</p>
          ${companyEmail ? `<p>${escapeHtml(companyEmail)}</p>` : ''}
          ${companyPhone ? `<p>${escapeHtml(companyPhone)}</p>` : ''}
          ${companyWebsite ? `<p>${escapeHtml(companyWebsite)}</p>` : ''}
          ${companyAddressEn || companyCity || companyPostalCode ? `<p>${[companyAddressEn, companyCity, companyPostalCode].filter(Boolean).map(s => escapeHtml(s as string)).join(', ')}</p>` : ''}
          ${companyVatNumber ? `<p>VAT: ${escapeHtml(companyVatNumber)}</p>` : ''}
          ${companyCrNumber ? `<p>CR: ${escapeHtml(companyCrNumber)}</p>` : ''}
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

      <div class="refund-policy">
        <h3 style="text-align: center;">Refund policy / سياسة استرداد الاموال</h3>
        <div class="refund-policy-content">
          <div class="en">
            <p>1-when canceling the subscription before the expiration of the specified period of the subscription item, the financial balance will be calculated at the value of one month's subscription of 199 Saudi riyals only, only when subscribing annually, while there is a discount applied by the company that owns the application.</p>
            <p>2-if the subscription is canceled with several months and a few days, the value of the days will be calculated by dividing the value of the monthly subscription by the number of days of the month 30 days.</p>
          </div>
          <div class="ar">
            <p>1- عند الغاء الاشتراك قبل مضي المدة المحددة لبند الاشتراك سيتم احتساب المتبقي المالي بقيمة اشتراك الشهر الواحد البالغ 199 ريال سعودي فقط لا غير عند الاشتراك سنويا اثناء وجود خصم مطبق من قبل الشركة المالكة للتطبيق.</p>
            <p>2- اذا تم الغاء الاشتراك بوجود عدة اشهر وبضعة ايام سيتم احتساب قيمة الايام بتقسيم قيمة الاشترااك الشهري على عدد ايام الشهر 30 يوما.</p>
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

// Investor Statement PDF Generation
interface InvestorStatementData {
  investor: {
    id: string;
    name: string;
    amountInvested: string;
    interestPercentage: string;
    notes?: string | null;
    createdAt: Date;
    investorType?: string; // "money" or "recipe"
    recipeName?: string; // Name of the recipe for recipe-type investors
  };
  companyName: string;
  companyVAT: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  netProfit: number;
  monthlyEarnings: number;
  totalRevenue: number;
  totalCOGS: number;
  totalSalaries: number;
  totalBills: number;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  logoPath?: string;
}

function generateInvestorStatementHTML(data: InvestorStatementData): string {
  const {
    investor,
    companyName,
    companyVAT,
    companyAddress,
    companyPhone,
    companyEmail,
    netProfit,
    monthlyEarnings,
    totalRevenue,
    totalCOGS,
    totalSalaries,
    totalBills,
    statementDate,
    periodStart,
    periodEnd,
  } = data;

  const escapedCompanyName = escapeHtml(companyName);
  const escapedInvestorName = escapeHtml(investor.name);
  const escapedCompanyVAT = escapeHtml(companyVAT);
  const escapedCompanyAddress = escapeHtml(companyAddress);
  const escapedCompanyPhone = escapeHtml(companyPhone);
  const escapedCompanyEmail = escapeHtml(companyEmail);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${logoDataURL}" alt="Business Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;" />
        </div>
      `;
      }
    } catch (error) {
      console.error('[InvestorStatement] Failed to load logo:', error);
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Noto Naskh Arabic', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }
    
    .statement-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
    }
    
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 20px 25px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin-bottom: 15px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .statement-badge {
      display: inline-block;
      background: white;
      color: #059669;
      padding: 5px 18px;
      border-radius: 15px;
      font-weight: 700;
      font-size: 11px;
      margin-top: 5px;
    }
    
    .section {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .section-title {
      font-weight: 700;
      font-size: 12px;
      color: #059669;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #059669;
      padding-bottom: 6px;
    }
    
    .bilingual-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .bilingual-header .ar {
      direction: rtl;
      text-align: right;
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 600;
      color: #374151;
    }
    
    .info-value {
      color: #1a1a1a;
      font-weight: 500;
    }
    
    .highlight-value {
      color: #059669;
      font-weight: 700;
      font-size: 14px;
    }
    
    .earnings-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .earnings-table thead {
      background: #059669;
      color: white;
    }
    
    .earnings-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .earnings-table th.rtl {
      text-align: right;
    }
    
    .earnings-table th.text-right {
      text-align: right;
    }
    
    .earnings-table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    .earnings-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .earnings-table td {
      padding: 10px 12px;
      font-size: 10px;
    }
    
    .text-right {
      text-align: right;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 15px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .summary-row:last-child {
      border-bottom: none;
      padding-top: 12px;
    }
    
    .summary-label {
      font-weight: 500;
    }
    
    .summary-value {
      font-weight: 700;
      font-size: 16px;
    }
    
    .total-row {
      font-size: 18px;
    }
    
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 9px;
    }
    
    .footer p {
      margin: 3px 0;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 20px;
    }
    
    .signature-box {
      width: 45%;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 2px solid #374151;
      margin-bottom: 8px;
      height: 50px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="statement-container">
    ${logoHTML}
    <div class="header">
      <div class="company-name">${escapedCompanyName}</div>
      <div class="statement-badge">INVESTOR STATEMENT / كشف حساب المستثمر</div>
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Company Information</span>
        <span class="ar">معلومات الشركة</span>
      </div>
      <div class="info-grid">
        <div>
          <div class="info-row">
            <span class="info-label">VAT Number:</span>
            <span class="info-value">${escapedCompanyVAT}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${escapedCompanyPhone}</span>
          </div>
        </div>
        <div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${escapedCompanyAddress}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${escapedCompanyEmail}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Investor Details / تفاصيل المستثمر</span>
      </div>
      <div class="info-grid">
        <div>
          <div class="info-row">
            <span class="info-label">Investor Name / اسم المستثمر:</span>
            <span class="info-value">${escapedInvestorName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Investor Type / نوع المستثمر:</span>
            <span class="info-value">${investor.investorType === 'recipe' ? 'Recipe Owner / صاحب وصفة' : 'Money Investor / مستثمر مالي'}</span>
          </div>
          ${investor.investorType === 'recipe' && investor.recipeName ? `
          <div class="info-row">
            <span class="info-label">Recipe / الوصفة:</span>
            <span class="info-value highlight-value">${escapeHtml(investor.recipeName)}</span>
          </div>
          ` : `
          <div class="info-row">
            <span class="info-label">Amount Invested / المبلغ المستثمر:</span>
            <span class="info-value highlight-value">${formatCurrency(parseFloat(investor.amountInvested))} SAR</span>
          </div>
          `}
        </div>
        <div>
          <div class="info-row">
            <span class="info-label">Interest Percentage / نسبة الفائدة:</span>
            <span class="info-value">${investor.interestPercentage}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Investment Date / تاريخ الاستثمار:</span>
            <span class="info-value">${formatDate(investor.createdAt)}</span>
          </div>
        </div>
      </div>
      ${investor.notes ? `
      <div class="info-row" style="margin-top: 10px;">
        <span class="info-label">Notes / ملاحظات:</span>
        <span class="info-value">${escapeHtml(investor.notes)}</span>
      </div>
      ` : ''}
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Statement Period / فترة كشف الحساب</span>
      </div>
      <div class="info-row">
        <span class="info-label">Statement Date / تاريخ الكشف:</span>
        <span class="info-value">${formatDate(statementDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Period / الفترة:</span>
        <span class="info-value">${formatDate(periodStart)} - ${formatDate(periodEnd)}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Earnings Breakdown / تفصيل الأرباح</span>
      </div>
      <table class="earnings-table">
        <thead>
          <tr>
            <th>Description / الوصف</th>
            <th class="text-right">Amount (SAR) / المبلغ (ريال)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Total Revenue / إجمالي الإيرادات</strong></td>
            <td class="text-right">${formatCurrency(totalRevenue)}</td>
          </tr>
          <tr>
            <td>Less: Cost of Goods Sold / ناقص: تكلفة البضائع المباعة</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(totalCOGS)})</td>
          </tr>
          <tr>
            <td>Less: Salaries & Wages / ناقص: الرواتب والأجور</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(totalSalaries)})</td>
          </tr>
          <tr>
            <td>Less: Operating Expenses / ناقص: المصاريف التشغيلية</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(totalBills)})</td>
          </tr>
          <tr style="background: #ecfdf5;">
            <td><strong>Net Profit / صافي الربح</strong></td>
            <td class="text-right" style="color: #059669; font-weight: 700;">${formatCurrency(netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Net Profit for Period / صافي الربح للفترة</span>
        <span class="summary-value">${formatCurrency(netProfit)} SAR</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Your Share (${investor.interestPercentage}%) / حصتك</span>
        <span class="summary-value">${formatCurrency(monthlyEarnings)} SAR</span>
      </div>
      <div class="summary-row total-row">
        <span class="summary-label"><strong>Total Receivable / إجمالي المستحق</strong></span>
        <span class="summary-value">${formatCurrency(monthlyEarnings)} SAR</span>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Authorized Signature / التوقيع المعتمد</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Investor Signature / توقيع المستثمر</div>
      </div>
    </div>
    
    <div class="footer">
      <p>This statement is generated electronically and is valid without signature for informational purposes.</p>
      <p>هذا الكشف تم إنشاؤه إلكترونياً وهو صالح بدون توقيع لأغراض المعلومات.</p>
      <p style="margin-top: 8px;">Generated on ${formatDate(new Date())} | ${escapedCompanyName}</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generateInvestorStatementPDF(data: InvestorStatementData): Promise<Buffer> {
  console.log('[InvestorStatement] Generating PDF for investor:', data.investor.name);
  
  const html = generateInvestorStatementHTML(data);
  
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

    console.log('[InvestorStatement] PDF generated successfully');
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// BSS Analysis Statement Data Interface
interface BssAnalysisStatementData {
  subscriptionRevenue: number;
  vatCollected: number;
  totalRevenue: number;
  totalInvoices: number;
  totalExpenses: number;
  expenseVat: number;
  totalBills: number;
  netProfit: number;
  netVat: number;
  profitMargin: number;
  totalClients: number;
  totalAccounts: number;
  restaurantCount: number;
  factoryCount: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  planBreakdown: { weekly: number; monthly: number; yearly: number };
  revenueByPlan: { weekly: number; monthly: number; yearly: number };
  periodStart: Date;
  periodEnd: Date;
  businessInfo?: {
    companyNameEn?: string | null;
    companyNameAr?: string | null;
    vatNumber?: string | null;
    crNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    addressEn?: string | null;
  } | null;
}

function generateBssAnalysisStatementHTML(data: BssAnalysisStatementData): string {
  const bi = data.businessInfo || {};
  const companyNameEn = bi.companyNameEn || "BlindSpot System (BSS)";
  const companyNameAr = bi.companyNameAr || "نظام بلايند سبوت";
  const companyEmail = bi.email || "IT@SaudiKinzhal.org";
  const companyPhone = bi.phone || "";
  const companyAddress = bi.addressEn || "Saudi Arabia";
  const companyVat = bi.vatNumber || "";
  const companyCr = bi.crNumber || "";

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const escapedCompanyNameEn = escapeHtml(companyNameEn);
  const escapedCompanyNameAr = escapeHtml(companyNameAr);
  const escapedCompanyEmail = escapeHtml(companyEmail);
  const escapedCompanyPhone = escapeHtml(companyPhone);
  const escapedCompanyAddress = escapeHtml(companyAddress);
  const escapedCompanyVat = escapeHtml(companyVat);
  const escapedCompanyCr = escapeHtml(companyCr);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Noto Naskh Arabic', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
    }
    
    .header {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .company-info {
      text-align: left;
    }
    
    .company-info-ar {
      text-align: right;
      direction: rtl;
    }
    
    .company-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 3px;
    }
    
    .company-name-ar {
      font-size: 20px;
      font-weight: 600;
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .company-detail {
      font-size: 10px;
      opacity: 0.9;
    }
    
    .document-title {
      text-align: center;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    
    .document-title h1 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 3px;
    }
    
    .document-title h2 {
      font-size: 16px;
      font-weight: 600;
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .period-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .period-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .period-value {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    
    .metric-card.green {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-color: #86efac;
    }
    
    .metric-card.blue {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #93c5fd;
    }
    
    .metric-card.red {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-color: #fca5a5;
    }
    
    .metric-card.purple {
      background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
      border-color: #c4b5fd;
    }
    
    .metric-label {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }
    
    .metric-label-ar {
      font-size: 9px;
      color: #64748b;
      font-family: 'Noto Naskh Arabic', sans-serif;
      direction: rtl;
    }
    
    .metric-value {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .metric-value.green { color: #16a34a; }
    .metric-value.blue { color: #2563eb; }
    .metric-value.red { color: #dc2626; }
    .metric-value.purple { color: #7c3aed; }
    
    .metric-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }
    
    .section-title-ar {
      font-family: 'Noto Naskh Arabic', sans-serif;
      direction: rtl;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .info-table th,
    .info-table td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
    }
    
    .info-table th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
    }
    
    .info-table td.value {
      text-align: right;
      font-weight: 600;
    }
    
    .info-table td.value.green { color: #16a34a; }
    .info-table td.value.blue { color: #2563eb; }
    .info-table td.value.red { color: #dc2626; }
    
    .summary-box {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .summary-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .summary-item {
      background: rgba(255, 255, 255, 0.15);
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    
    .summary-item-label {
      font-size: 9px;
      opacity: 0.9;
      margin-bottom: 3px;
    }
    
    .summary-item-value {
      font-size: 14px;
      font-weight: 700;
    }
    
    .footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 9px;
      color: #64748b;
    }
    
    .footer p {
      margin-bottom: 3px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
    }
    
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-gray { background: #f1f5f9; color: #64748b; }
    .badge-orange { background: #ffedd5; color: #ea580c; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <div class="company-info">
          <div class="company-name">${escapedCompanyNameEn}</div>
          ${escapedCompanyEmail ? `<div class="company-detail">${escapedCompanyEmail}</div>` : ''}
          ${escapedCompanyPhone ? `<div class="company-detail">${escapedCompanyPhone}</div>` : ''}
        </div>
        <div class="company-info-ar">
          <div class="company-name company-name-ar">${escapedCompanyNameAr}</div>
          ${escapedCompanyVat ? `<div class="company-detail">VAT: ${escapedCompanyVat}</div>` : ''}
          ${escapedCompanyCr ? `<div class="company-detail">CR: ${escapedCompanyCr}</div>` : ''}
        </div>
      </div>
      <div class="document-title">
        <h1>BSS Business Analysis Statement</h1>
        <h2>كشف تحليل أعمال BSS</h2>
      </div>
    </div>
    
    <div class="period-info">
      <div>
        <div class="period-label">Report Period / فترة التقرير</div>
        <div class="period-value">${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}</div>
      </div>
      <div style="text-align: right;">
        <div class="period-label">Generated On / تاريخ الإصدار</div>
        <div class="period-value">${formatDate(new Date())}</div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card green">
        <div class="metric-label">Subscription Revenue</div>
        <div class="metric-label-ar">إيرادات الاشتراكات</div>
        <div class="metric-value green">${formatCurrency(data.subscriptionRevenue)} SAR</div>
        <div class="metric-sub">${data.totalInvoices} invoices</div>
      </div>
      <div class="metric-card blue">
        <div class="metric-label">VAT Collected</div>
        <div class="metric-label-ar">ضريبة القيمة المضافة المحصلة</div>
        <div class="metric-value blue">${formatCurrency(data.vatCollected)} SAR</div>
        <div class="metric-sub">15% VAT Rate</div>
      </div>
      <div class="metric-card red">
        <div class="metric-label">Total Expenses</div>
        <div class="metric-label-ar">إجمالي المصروفات</div>
        <div class="metric-value red">${formatCurrency(data.totalExpenses)} SAR</div>
        <div class="metric-sub">${data.totalBills} bills</div>
      </div>
      <div class="metric-card purple">
        <div class="metric-label">Net Profit</div>
        <div class="metric-label-ar">صافي الربح</div>
        <div class="metric-value ${data.netProfit >= 0 ? 'purple' : 'red'}">${formatCurrency(data.netProfit)} SAR</div>
        <div class="metric-sub">Margin: ${data.profitMargin.toFixed(1)}%</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">
        <span>Client & Account Summary</span>
        <span class="section-title-ar">ملخص العملاء والحسابات</span>
      </div>
      <div class="two-column">
        <table class="info-table">
          <tr>
            <th colspan="2">Account Distribution / توزيع الحسابات</th>
          </tr>
          <tr>
            <td>Total Clients / إجمالي العملاء</td>
            <td class="value">${data.totalClients}</td>
          </tr>
          <tr>
            <td>Total Accounts / إجمالي الحسابات</td>
            <td class="value">${data.totalAccounts}</td>
          </tr>
          <tr>
            <td>Restaurant Clients / عملاء المطاعم</td>
            <td class="value"><span class="badge badge-orange">${data.restaurantCount}</span></td>
          </tr>
          <tr>
            <td>Factory Clients / عملاء المصانع</td>
            <td class="value"><span class="badge badge-blue">${data.factoryCount}</span></td>
          </tr>
        </table>
        <table class="info-table">
          <tr>
            <th colspan="2">Subscription Status / حالة الاشتراكات</th>
          </tr>
          <tr>
            <td>Active Subscriptions / الاشتراكات النشطة</td>
            <td class="value"><span class="badge badge-green">${data.activeSubscriptions}</span></td>
          </tr>
          <tr>
            <td>Expired Subscriptions / الاشتراكات المنتهية</td>
            <td class="value"><span class="badge badge-red">${data.expiredSubscriptions}</span></td>
          </tr>
          <tr>
            <td>Cancelled Subscriptions / الاشتراكات الملغاة</td>
            <td class="value"><span class="badge badge-gray">${data.cancelledSubscriptions}</span></td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">
        <span>Revenue by Subscription Plan</span>
        <span class="section-title-ar">الإيرادات حسب خطة الاشتراك</span>
      </div>
      <table class="info-table">
        <tr>
          <th>Plan / الخطة</th>
          <th style="text-align: center;">Clients / العملاء</th>
          <th style="text-align: right;">Revenue / الإيرادات</th>
        </tr>
        <tr>
          <td>Weekly Plan / الخطة الأسبوعية</td>
          <td style="text-align: center;">${data.planBreakdown.weekly}</td>
          <td class="value green">${formatCurrency(data.revenueByPlan.weekly)} SAR</td>
        </tr>
        <tr>
          <td>Monthly Plan / الخطة الشهرية</td>
          <td style="text-align: center;">${data.planBreakdown.monthly}</td>
          <td class="value green">${formatCurrency(data.revenueByPlan.monthly)} SAR</td>
        </tr>
        <tr>
          <td>Yearly Plan / الخطة السنوية</td>
          <td style="text-align: center;">${data.planBreakdown.yearly}</td>
          <td class="value green">${formatCurrency(data.revenueByPlan.yearly)} SAR</td>
        </tr>
      </table>
    </div>
    
    <div class="summary-box">
      <div class="summary-title">Financial Overview / نظرة مالية عامة</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-item-label">Total Revenue / إجمالي الإيرادات</div>
          <div class="summary-item-value">${formatCurrency(data.totalRevenue)} SAR</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Net VAT / صافي ضريبة القيمة المضافة</div>
          <div class="summary-item-value">${formatCurrency(data.netVat)} SAR</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Profit Margin / هامش الربح</div>
          <div class="summary-item-value">${data.profitMargin.toFixed(1)}%</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>This statement is generated electronically by BlindSpot System (BSS) and is valid for informational purposes.</p>
      <p>هذا الكشف تم إنشاؤه إلكترونياً بواسطة نظام بلايند سبوت وهو صالح لأغراض المعلومات.</p>
      <p style="margin-top: 8px; font-weight: 600;">${escapedCompanyNameEn} | ${escapedCompanyAddress}</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generateBssAnalysisStatementPDF(data: BssAnalysisStatementData): Promise<Buffer> {
  console.log('[BssAnalysis] Generating PDF statement');
  
  const html = generateBssAnalysisStatementHTML(data);
  
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

    console.log('[BssAnalysis] PDF generated successfully');
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
