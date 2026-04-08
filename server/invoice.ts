import puppeteer, { Browser } from "puppeteer";
import QRCode from "qrcode";
import type { Order } from "@shared/schema";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import * as path from "path";

// ============================================================================
// SHARED PDF STYLE CONSTANTS
// Unified styling for all PDF generators to ensure consistency
// ============================================================================

const PDF_STYLES = {
  // Font imports
  fontImport: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');`,
  
  // Font families
  fonts: {
    primary: "'Inter', 'Noto Naskh Arabic', sans-serif",
    arabic: "'Noto Naskh Arabic', 'Inter', sans-serif",
    english: "'Inter', sans-serif",
  },
  
  // Font sizes - COMPACT for single-page PDFs
  fontSize: {
    xs: '6px',
    sm: '7px',
    base: '8px',
    md: '9px',
    lg: '10px',
    xl: '12px',
    '2xl': '14px',
    '3xl': '16px',
  },
  
  // Colors (consistent brand colors)
  colors: {
    primary: '#2962ff',
    primaryDark: '#1e40af',
    text: '#1a1a1a',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    background: '#f8f9fa',
    backgroundAlt: '#e3f2fd',
    white: '#ffffff',
  },
  
  // Standard margins for PDF pages - COMPACT
  margins: {
    page: '6mm',
    container: '6mm',
  },
  
  // Page settings - ONE PAGE CONSTRAINT
  pageSettings: `
    @page {
      size: A4;
      margin: 6mm;
    }
  `,
  
  // Base reset styles
  baseReset: `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  `,
  
  // Print-specific styles for proper page breaks
  printStyles: `
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `,
  
  // Table styles for consistent formatting - COMPACT
  tableStyles: `
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      display: table-header-group;
    }
    tbody {
      display: table-row-group;
    }
    tr {
      page-break-inside: avoid;
    }
    tfoot {
      display: table-footer-group;
    }
  `,
  
  // Page break utilities - PREVENT breaks for one-page
  pageBreakStyles: `
    .page-break-before { page-break-before: always; }
    .page-break-after { page-break-after: always; }
    .avoid-break { page-break-inside: avoid; }
    .keep-together { page-break-inside: avoid; break-inside: avoid; }
    .no-break { page-break-inside: avoid; break-inside: avoid; }
  `,
  
  // One-page constraint styles
  onePageStyles: `
    html, body {
      height: 277mm;
      max-height: 277mm;
      overflow: hidden;
    }
    .pdf-container {
      max-height: 277mm;
      overflow: hidden;
    }
  `,
};

// Helper function to generate complete base CSS for PDFs - ONE PAGE LAYOUT
function getBasePdfStyles(): string {
  return `
    ${PDF_STYLES.fontImport}
    ${PDF_STYLES.baseReset}
    ${PDF_STYLES.pageSettings}
    ${PDF_STYLES.printStyles}
    ${PDF_STYLES.tableStyles}
    ${PDF_STYLES.pageBreakStyles}
    ${PDF_STYLES.onePageStyles}
    
    body {
      font-family: ${PDF_STYLES.fonts.primary};
      font-size: ${PDF_STYLES.fontSize.base};
      line-height: 1.2;
      color: ${PDF_STYLES.colors.text};
      background: ${PDF_STYLES.colors.white};
    }
    
    .arabic {
      font-family: ${PDF_STYLES.fonts.arabic};
    }
    
    .english {
      font-family: ${PDF_STYLES.fonts.english};
    }
  `;
}

// Standard PDF margins for puppeteer - COMPACT for one-page
const PDF_MARGINS = {
  top: '6mm',
  right: '6mm',
  bottom: '6mm',
  left: '6mm',
};

// ============================================================================

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
  invoiceType?: "standard" | "simplified"; // B2B (standard) or B2C (simplified)
  customerVatNumber?: string; // Required for B2B Standard invoices
  documentType?: "invoice" | "credit_note" | "debit_note"; // Document type for ZATCA
  referencedInvoiceNumber?: string; // Original invoice number for credit/debit notes
  adjustmentReason?: string; // Reason for credit/debit note
}

// HTML escaping function to prevent injection
function escapeHtml(text: string | undefined | null): string {
  if (text === undefined || text === null) {
    return '';
  }
  const str = String(text);
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

// Detect Chromium executable path with fallbacks
function getChromiumPath(): string | undefined {
  // 1. Check environment variable override
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    console.log(`[Invoice] Using Chromium from env: ${process.env.CHROMIUM_PATH}`);
    return process.env.CHROMIUM_PATH;
  }

  // 2. Try to find via which command (chromium, chromium-browser, google-chrome)
  try {
    const chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null || which google-chrome-stable 2>/dev/null', { encoding: 'utf8' }).trim();
    if (chromiumPath && existsSync(chromiumPath)) {
      console.log(`[Invoice] Found Chromium via which: ${chromiumPath}`);
      return chromiumPath;
    }
  } catch (e) {
    // Continue to next fallback
  }

  // 3. Common Linux paths for Chromium/Chrome
  const commonPaths = [
    // Standard Linux paths
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    // Snap installations
    '/snap/bin/chromium',
    '/snap/bin/google-chrome',
    // Common alternative locations
    '/opt/google/chrome/chrome',
    '/opt/google/chrome/google-chrome',
    '/opt/chromium/chromium',
    // Nix store paths (Replit environment)
    '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
  ];
  
  for (const path of commonPaths) {
    if (existsSync(path)) {
      console.log(`[Invoice] Using browser at: ${path}`);
      return path;
    }
  }

  console.warn('[Invoice] No Chromium/Chrome executable found, falling back to Puppeteer default');
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
      
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--single-process',
          '--no-zygote'
        ]
      };

      // Use detected chromium path, or let Puppeteer use its bundled version
      if (chromiumPath) {
        launchOptions.executablePath = chromiumPath;
        console.log(`[Invoice] Launching browser with: ${chromiumPath}`);
      } else {
        console.log('[Invoice] Launching browser with Puppeteer bundled Chromium');
      }

      const browser = await puppeteer.launch(launchOptions);

      browserInstance = browser;
      console.log('[Invoice] Browser launched successfully');
      return browser;
    } catch (launchError: any) {
      console.error('[Invoice] Browser launch failed:', launchError.message);
      throw new Error(`Failed to launch browser for PDF generation: ${launchError.message}. Please ensure Chromium/Google Chrome is installed.`);
    } finally {
      browserLaunchPromise = null;
    }
  })();

  return browserLaunchPromise;
}

function generateBilingualInvoiceHTML(data: InvoiceData, qrCodeDataURL: string): string {
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate } = data;
  
  // Determine invoice type: B2B (standard) vs B2C (simplified)
  const isB2B = data.invoiceType === "standard";
  const escapedCustomerVAT = data.customerVatNumber ? escapeHtml(data.customerVatNumber) : "";
  
  // Determine document type for credit/debit notes
  const documentType = data.documentType || "invoice";
  const isCreditNote = documentType === "credit_note";
  const isDebitNote = documentType === "debit_note";
  const isAdjustmentNote = isCreditNote || isDebitNote;
  const escapedReferencedInvoice = data.referencedInvoiceNumber ? escapeHtml(data.referencedInvoiceNumber) : "";
  const escapedAdjustmentReason = data.adjustmentReason ? escapeHtml(data.adjustmentReason) : "";
  
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
      // Logo is stored as "/uploads/logos/..." but files are in "public/uploads/logos/..."
      const relativePath = data.logoPath.replace(/^\/+/, '');
      const logoFullPath = path.join(process.cwd(), 'public', relativePath);
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
    ${getBasePdfStyles()}
    
    body {
      font-size: ${PDF_STYLES.fontSize.sm};
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 4mm;
    }
    
    .header {
      background: linear-gradient(135deg, ${PDF_STYLES.colors.primary} 0%, ${PDF_STYLES.colors.primaryDark} 100%);
      color: ${PDF_STYLES.colors.white};
      padding: 8px 12px;
      text-align: center;
      border-radius: 4px 4px 0 0;
      margin-bottom: 6px;
    }
    
    .company-name {
      font-size: ${PDF_STYLES.fontSize.xl};
      font-weight: 700;
      margin-bottom: 3px;
      letter-spacing: 0.2px;
    }
    
    .invoice-badge {
      display: inline-block;
      background: ${PDF_STYLES.colors.white};
      color: ${PDF_STYLES.colors.primary};
      padding: 2px 10px;
      border-radius: 8px;
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.xs};
      margin-top: 2px;
    }
    
    .bilingual-section {
      display: flex;
      gap: 6px;
      margin-bottom: 5px;
    }
    
    .section-left, .section-right {
      flex: 1;
      padding: 5px 8px;
      border-radius: 3px;
      border: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .section-left {
      background: ${PDF_STYLES.colors.background};
    }
    
    .section-right {
      background: ${PDF_STYLES.colors.backgroundAlt};
      direction: rtl;
      text-align: right;
    }
    
    .section-title {
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: ${PDF_STYLES.colors.primaryDark};
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 2px;
      font-size: ${PDF_STYLES.fontSize.xs};
      line-height: 1.2;
    }
    
    .section-right .info-row {
      flex-direction: row-reverse;
      text-align: right;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 60px;
      color: ${PDF_STYLES.colors.textSecondary};
    }
    
    .info-value {
      color: ${PDF_STYLES.colors.text};
      word-break: break-word;
    }
    
    .customer-section {
      background: ${PDF_STYLES.colors.background};
      padding: 4px 8px;
      border-radius: 3px;
      margin-bottom: 5px;
      border: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .customer-grid {
      display: flex;
      gap: 12px;
    }
    
    .customer-col {
      flex: 1;
    }
    
    .items-table {
      margin-bottom: 5px;
      border: 1px solid ${PDF_STYLES.colors.border};
      border-radius: 3px;
      overflow: hidden;
    }
    
    .items-table thead {
      display: table-header-group;
      background: ${PDF_STYLES.colors.primary};
      color: ${PDF_STYLES.colors.white};
    }
    
    .items-table th {
      padding: 3px 5px;
      text-align: left;
      font-weight: 600;
      font-size: ${PDF_STYLES.fontSize.xs};
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    
    .items-table th.rtl {
      text-align: right;
    }
    
    .items-table tbody tr:nth-child(even) {
      background: ${PDF_STYLES.colors.background};
    }
    
    .items-table tbody tr {
      border-bottom: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .items-table td {
      padding: 3px 5px;
      font-size: ${PDF_STYLES.fontSize.xs};
      word-break: break-word;
      line-height: 1.2;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals-section {
      max-width: 220px;
      margin-left: auto;
      margin-bottom: 5px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 6px;
      font-size: ${PDF_STYLES.fontSize.xs};
    }
    
    .totals-row.total {
      background: ${PDF_STYLES.colors.primary};
      color: ${PDF_STYLES.colors.white};
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.sm};
      border-radius: 3px;
      padding: 4px 8px;
      margin-top: 3px;
    }
    
    .totals-row.subtotal {
      border-bottom: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .qr-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: ${PDF_STYLES.colors.background};
      padding: 6px 10px;
      border-radius: 3px;
      border: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .qr-code {
      width: 55px;
      height: 55px;
      border: 1px solid ${PDF_STYLES.colors.border};
      border-radius: 3px;
      padding: 2px;
      flex-shrink: 0;
    }
    
    .footer-content {
      flex: 1;
    }
    
    .zatca-badge {
      color: ${PDF_STYLES.colors.primary};
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.xs};
      margin-bottom: 2px;
    }
    
    .footer-text {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: ${PDF_STYLES.colors.textMuted};
      margin-bottom: 1px;
      line-height: 1.2;
    }
  </style>
</head>
<body>
  <div class="invoice-container pdf-container">
    <!-- Header -->
    <div class="header">
      ${logoHTML}
      <div class="company-name english">${escapedCompanyName}</div>
      ${isCreditNote 
        ? '<div class="invoice-badge" style="background: #dc2626; color: white;">CREDIT NOTE | إشعار دائن</div>'
        : isDebitNote
        ? '<div class="invoice-badge" style="background: #ea580c; color: white;">DEBIT NOTE | إشعار مدين</div>'
        : isB2B 
        ? '<div class="invoice-badge">STANDARD TAX INVOICE | فاتورة ضريبية قياسية</div>'
        : '<div class="invoice-badge">SIMPLIFIED TAX INVOICE | فاتورة ضريبية مبسطة</div>'}
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
    
    ${isB2B && escapedCustomerVAT ? `
    <!-- Buyer Information - B2B Standard Invoice Only -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english">
        <div class="section-title">Buyer Information</div>
        <div class="info-row">
          <div class="info-label">Buyer VAT:</div>
          <div class="info-value">${escapedCustomerVAT}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">معلومات المشتري</div>
        <div class="info-row">
          <div class="info-value">${escapedCustomerVAT}</div>
          <div class="info-label">:الرقم الضريبي للمشتري</div>
        </div>
      </div>
    </div>
    ` : ''}
    
    ${isAdjustmentNote && escapedReferencedInvoice ? `
    <!-- Referenced Invoice - Credit/Debit Notes Only -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english" style="background: ${isCreditNote ? '#fef2f2' : '#fff7ed'}; border-color: ${isCreditNote ? '#fecaca' : '#fed7aa'};">
        <div class="section-title" style="color: ${isCreditNote ? '#dc2626' : '#ea580c'};">${isCreditNote ? 'Credit Note Reference' : 'Debit Note Reference'}</div>
        <div class="info-row">
          <div class="info-label">Original Invoice:</div>
          <div class="info-value">${escapedReferencedInvoice}</div>
        </div>
        ${escapedAdjustmentReason ? `
        <div class="info-row">
          <div class="info-label">Reason:</div>
          <div class="info-value">${escapedAdjustmentReason}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic" style="background: ${isCreditNote ? '#fef2f2' : '#fff7ed'}; border-color: ${isCreditNote ? '#fecaca' : '#fed7aa'};">
        <div class="section-title" style="color: ${isCreditNote ? '#dc2626' : '#ea580c'};">${isCreditNote ? 'مرجع إشعار الدائن' : 'مرجع إشعار المدين'}</div>
        <div class="info-row">
          <div class="info-value">${escapedReferencedInvoice}</div>
          <div class="info-label">:الفاتورة الأصلية</div>
        </div>
        ${escapedAdjustmentReason ? `
        <div class="info-row">
          <div class="info-value">${escapedAdjustmentReason}</div>
          <div class="info-label">:السبب</div>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
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
        ${(order.items || []).map(item => {
          const itemName = escapeHtml(item?.name || 'Unknown Item');
          const itemQty = item?.quantity !== undefined && item?.quantity !== null ? Number(item.quantity) : 0;
          const rawPrice = item?.price !== undefined && item?.price !== null ? item.price : 0;
          const itemPrice = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice);
          const itemTotal = (itemQty * itemPrice).toFixed(2);
          return `
          <tr>
            <td class="english">${itemName}</td>
            <td class="text-right arabic">${itemName}</td>
            <td class="text-center">${itemQty}</td>
            <td class="text-center">${itemPrice.toFixed(2)}</td>
            <td class="text-center">${itemTotal}</td>
          </tr>
        `}).join('')}
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
          margin: PDF_MARGINS
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
    ${getBasePdfStyles()}
    
    body {
      font-size: ${PDF_STYLES.fontSize.sm};
      padding: 4mm;
    }
    
    .pdf-container {
      max-height: 277mm;
      overflow: hidden;
    }
    
    .header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 2px solid ${PDF_STYLES.colors.primary};
      padding-bottom: 6px;
    }
    
    .company-name {
      font-size: ${PDF_STYLES.fontSize.xl};
      font-weight: 700;
      color: ${PDF_STYLES.colors.primary};
      margin-bottom: 3px;
    }
    
    .document-title {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 600;
      color: ${PDF_STYLES.colors.textSecondary};
      margin-bottom: 2px;
    }
    
    .year {
      font-size: ${PDF_STYLES.fontSize.md};
      color: ${PDF_STYLES.colors.textMuted};
    }
    
    .meta-info {
      margin-bottom: 8px;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: ${PDF_STYLES.colors.textMuted};
    }
    
    .summary-box {
      background: linear-gradient(135deg, ${PDF_STYLES.colors.primary} 0%, ${PDF_STYLES.colors.primaryDark} 100%);
      color: white;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    .summary-title {
      font-size: ${PDF_STYLES.fontSize.md};
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .summary-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 6px;
      border-radius: 4px;
    }
    
    .summary-label {
      font-size: ${PDF_STYLES.fontSize.xs};
      opacity: 0.9;
      margin-bottom: 2px;
    }
    
    .summary-value {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 700;
    }
    
    .section-title {
      font-size: ${PDF_STYLES.fontSize.md};
      font-weight: 700;
      color: ${PDF_STYLES.colors.primaryDark};
      margin-bottom: 5px;
      padding-bottom: 3px;
      border-bottom: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    
    .data-table thead {
      background: ${PDF_STYLES.colors.background};
    }
    
    .data-table th {
      padding: 4px 6px;
      text-align: left;
      font-weight: 600;
      font-size: ${PDF_STYLES.fontSize.xs};
      text-transform: uppercase;
      color: ${PDF_STYLES.colors.textSecondary};
      border-bottom: 1px solid ${PDF_STYLES.colors.border};
    }
    
    .data-table th.text-right {
      text-align: right;
    }
    
    .data-table tbody tr:nth-child(even) {
      background: ${PDF_STYLES.colors.background};
    }
    
    .data-table td {
      padding: 3px 6px;
      font-size: ${PDF_STYLES.fontSize.xs};
      border-bottom: 1px solid ${PDF_STYLES.colors.border};
      word-break: break-word;
    }
    
    .data-table td.text-right {
      text-align: right;
    }
    
    .data-table tfoot {
      font-weight: 700;
      background: ${PDF_STYLES.colors.background};
    }
    
    .data-table tfoot td {
      padding: 4px 6px;
      border-top: 1px solid ${PDF_STYLES.colors.primary};
    }
    
    .footer {
      margin-top: 8px;
      padding-top: 5px;
      border-top: 1px solid ${PDF_STYLES.colors.border};
      text-align: center;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: ${PDF_STYLES.colors.textMuted};
    }
  </style>
</head>
<body>
  <div class="pdf-container">
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
      margin: PDF_MARGINS
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

interface ExpensesPDFData {
  companyName: string;
  companyVAT: string;
  year: string;
  totalExpenses: number;
  inventoryValue: number;
  totalBillsAmount: number;
  paidBillsAmount: number;
  pendingBillsAmount: number;
  billsByCategory: Array<{ category: string; amount: number }>;
  monthlyExpenses: Array<{ month: string; amount: number }>;
  breakEvenAnalysis?: {
    fixedCosts: number;
    variableCostsPerUnit: number;
    sellingPricePerUnit: number;
    contributionMarginPerUnit: number;
    contributionMarginTotal: number;
    breakEvenUnits: number;
    breakEvenRevenue: number;
    marginOfSafety: number;
    currentRevenue: number;
    unitsSold: number;
    isProfitable: boolean;
  };
}

export async function generateExpensesPDF(data: ExpensesPDFData): Promise<Buffer> {
  const escapedCompanyName = escapeHtml(data.companyName);
  const escapedCompanyVAT = escapeHtml(data.companyVAT);
  const escapedYear = escapeHtml(data.year);

  const bep = data.breakEvenAnalysis;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${getBasePdfStyles()}
    
    body {
      font-size: ${PDF_STYLES.fontSize.sm};
      padding: 8px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 6px;
    }
    
    .company-name {
      font-size: ${PDF_STYLES.fontSize.xl};
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 2px;
    }
    
    .document-title {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 600;
      color: #374151;
      margin-bottom: 2px;
    }
    
    .year {
      font-size: ${PDF_STYLES.fontSize.sm};
      color: #6b7280;
    }
    
    .meta-info {
      margin-bottom: 6px;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .summary-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      margin-bottom: 6px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    
    .summary-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 6px;
      border-radius: 3px;
    }
    
    .summary-label {
      font-size: ${PDF_STYLES.fontSize.xs};
      opacity: 0.9;
      margin-bottom: 1px;
    }
    
    .summary-value {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
    }
    
    .section {
      margin-bottom: 6px;
    }
    
    .section-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #991b1b;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    
    .data-table thead {
      background: #f3f4f6;
    }
    
    .data-table th {
      padding: 3px 4px;
      text-align: left;
      font-weight: 600;
      font-size: ${PDF_STYLES.fontSize.xs};
      text-transform: uppercase;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table th.text-right {
      text-align: right;
    }
    
    .data-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .data-table td {
      padding: 2px 4px;
      border-bottom: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
    }
    
    .data-table td.text-right {
      text-align: right;
    }
    
    .data-table tfoot {
      font-weight: 700;
      background: #f3f4f6;
    }
    
    .data-table tfoot td {
      padding: 3px 4px;
      border-top: 1px solid #dc2626;
    }
    
    .bep-box {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    
    .bep-box.loss {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    }
    
    .bep-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .bep-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }
    
    .bep-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 3px 4px;
      border-radius: 3px;
    }
    
    .bep-label {
      font-size: ${PDF_STYLES.fontSize.xs};
      opacity: 0.9;
      margin-bottom: 1px;
    }
    
    .bep-value {
      font-size: ${PDF_STYLES.fontSize.xs};
      font-weight: 700;
    }
    
    .footer {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="pdf-container">
  <div class="header">
    <div class="company-name">${escapedCompanyName}</div>
    <div class="document-title">Expenses Report</div>
    <div class="year">Year ${escapedYear}</div>
  </div>
  
  <div class="meta-info">
    <div>VAT Number: ${escapedCompanyVAT}</div>
    <div>Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</div>
  </div>
  
  <div class="summary-box">
    <div class="summary-title">Annual Expenses Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Expenses</div>
        <div class="summary-value">${data.totalExpenses.toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Inventory Value</div>
        <div class="summary-value">${data.inventoryValue.toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Bills Total</div>
        <div class="summary-value">${data.totalBillsAmount.toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Paid Bills</div>
        <div class="summary-value">${data.paidBillsAmount.toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Pending Bills</div>
        <div class="summary-value">${data.pendingBillsAmount.toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Payment Rate</div>
        <div class="summary-value">${((data.paidBillsAmount / data.totalBillsAmount) * 100 || 0).toFixed(1)}%</div>
      </div>
    </div>
  </div>
  
  ${bep ? `
  <div class="bep-box ${bep.isProfitable ? '' : 'loss'}">
    <div class="bep-title">Break-Even Analysis</div>
    <div class="bep-grid">
      <div class="bep-item">
        <div class="bep-label">Fixed Costs</div>
        <div class="bep-value">${bep.fixedCosts.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Variable Costs/Unit</div>
        <div class="bep-value">${bep.variableCostsPerUnit.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Selling Price/Unit</div>
        <div class="bep-value">${bep.sellingPricePerUnit.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Contribution Margin/Unit</div>
        <div class="bep-value">${bep.contributionMarginPerUnit.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Total Contribution Margin</div>
        <div class="bep-value">${bep.contributionMarginTotal.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Break-Even Units</div>
        <div class="bep-value">${Math.ceil(bep.breakEvenUnits)} units</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Break-Even Revenue</div>
        <div class="bep-value">${bep.breakEvenRevenue.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Current Revenue</div>
        <div class="bep-value">${bep.currentRevenue.toFixed(2)} SAR</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Margin of Safety</div>
        <div class="bep-value">${bep.marginOfSafety.toFixed(1)}%</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Units Sold</div>
        <div class="bep-value">${bep.unitsSold} units</div>
      </div>
      <div class="bep-item">
        <div class="bep-label">Status</div>
        <div class="bep-value">${bep.isProfitable ? 'PROFITABLE' : 'BELOW BEP'}</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <div class="section">
    <div class="section-title">Expenses by Category</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Category</th>
          <th class="text-right">Amount (SAR)</th>
          <th class="text-right">% of Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.billsByCategory.map(cat => `
          <tr>
            <td>${escapeHtml(cat.category)}</td>
            <td class="text-right">${cat.amount.toFixed(2)}</td>
            <td class="text-right">${((cat.amount / data.totalBillsAmount) * 100 || 0).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td>TOTAL</td>
          <td class="text-right">${data.totalBillsAmount.toFixed(2)}</td>
          <td class="text-right">100%</td>
        </tr>
      </tfoot>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Monthly Operating Expenses</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Amount (SAR)</th>
        </tr>
      </thead>
      <tbody>
        ${data.monthlyExpenses.map(m => `
          <tr>
            <td>${escapeHtml(m.month)}</td>
            <td class="text-right">${m.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td>TOTAL</td>
          <td class="text-right">${data.monthlyExpenses.reduce((sum, m) => sum + m.amount, 0).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  
  <div class="footer">
    <div>BlindSpot System (BSS) Expenses Report</div>
    <div>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</div>
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
      margin: PDF_MARGINS
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
  const companyEmail = bi.email || "IT@kinbss.org";
  const companyPhone = bi.phone || "";
  const companyWebsite = bi.website || "https://kinbss.org";
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
    ${getBasePdfStyles()}

    body {
      font-size: ${PDF_STYLES.fontSize.sm};
      padding: 6px;
    }

    .invoice-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 10px 15px;
      text-align: center;
    }

    .company-name {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 700;
      margin-bottom: 2px;
    }

    .invoice-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      opacity: 0.95;
      margin-top: 4px;
    }

    .content {
      padding: 10px 12px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      gap: 10px;
    }

    .info-block {
      flex: 1;
    }

    .info-block h3 {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }

    .info-block p {
      margin: 2px 0;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #374151;
      line-height: 1.3;
    }

    .info-block strong {
      color: #1f2937;
    }

    .invoice-details {
      background: #f9fafb;
      padding: 6px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .invoice-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }

    .detail-label {
      color: #6b7280;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .detail-value {
      font-weight: 600;
      color: #1f2937;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }

    .items-table th {
      background: #f3f4f6;
      padding: 4px 6px;
      text-align: left;
      font-size: ${PDF_STYLES.fontSize.xs};
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .items-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
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
      padding: 6px 8px;
      border-radius: 4px;
      margin-top: 6px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .summary-row.total {
      border-top: 1px solid #e5e7eb;
      margin-top: 4px;
      padding-top: 6px;
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #1e40af;
    }

    .qr-section {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
    }

    .qr-code {
      width: 60px;
      height: 60px;
      margin: 4px auto;
    }

    .footer {
      text-align: center;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
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
      border-radius: 4px;
      padding: 6px 8px;
      margin-top: 6px;
    }

    .security-clause h3 {
      font-size: ${PDF_STYLES.fontSize.xs};
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .security-clause-content {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .security-clause-content .en,
    .security-clause-content .ar {
      flex: 1;
      font-size: ${PDF_STYLES.fontSize.xs};
      line-height: 1.3;
      color: #374151;
    }

    .refund-policy {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      padding: 6px 8px;
      margin-top: 6px;
    }

    .refund-policy h3 {
      font-size: ${PDF_STYLES.fontSize.xs};
      font-weight: 700;
      color: #b45309;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .refund-policy-content {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .refund-policy-content .en,
    .refund-policy-content .ar {
      flex: 1;
      font-size: ${PDF_STYLES.fontSize.xs};
      line-height: 1.3;
      color: #78350f;
    }

    .refund-policy-content p {
      margin-bottom: 2px;
    }

    .refund-policy-content p:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="invoice-container pdf-container">
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
      margin: PDF_MARGINS
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
    ${getBasePdfStyles()}

    body {
      font-size: ${PDF_STYLES.fontSize.sm};
      padding: 6px;
    }

    .invoice-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      color: white;
      padding: 8px 12px;
      text-align: center;
    }

    .company-name {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 700;
      margin-bottom: 2px;
    }

    .invoice-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      opacity: 0.95;
      margin-top: 3px;
    }

    .content {
      padding: 8px 10px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      gap: 8px;
    }

    .info-block {
      flex: 1;
    }

    .info-block h3 {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      margin-bottom: 3px;
    }

    .info-block p {
      margin: 2px 0;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #374151;
      line-height: 1.2;
    }

    .info-block strong {
      color: #1f2937;
    }

    .invoice-details {
      background: #f0fdf4;
      padding: 5px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      border: 1px solid #bbf7d0;
    }

    .invoice-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }

    .detail-label {
      color: #6b7280;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .detail-value {
      font-weight: 600;
      color: #1f2937;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }

    .items-table th {
      background: #f3f4f6;
      padding: 3px 5px;
      text-align: left;
      font-size: ${PDF_STYLES.fontSize.xs};
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .items-table td {
      padding: 4px 5px;
      border-bottom: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
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
      padding: 5px 8px;
      border-radius: 4px;
      margin-top: 6px;
      border: 1px solid #bbf7d0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .summary-row.highlight {
      background: #dcfce7;
      padding: 3px 5px;
      border-radius: 3px;
      margin: 2px 0;
    }

    .summary-row.total {
      border-top: 1px solid #16a34a;
      margin-top: 4px;
      padding-top: 4px;
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #16a34a;
    }

    .qr-section {
      text-align: center;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
    }

    .qr-code {
      width: 50px;
      height: 50px;
      margin: 4px auto;
    }

    .footer {
      text-align: center;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
    }

    .footer p {
      margin: 1px 0;
    }

    .zatca-notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 4px 6px;
      border-radius: 3px;
      margin: 5px 0;
      text-align: center;
      font-size: ${PDF_STYLES.fontSize.xs};
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
  <div class="invoice-container pdf-container">
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
        <p style="margin-top: 4px;">This is a ZATCA-compliant VAT return certificate / هذه شهادة إقرار ضريبة القيمة المضافة متوافقة مع هيئة الزكاة</p>
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
      margin: PDF_MARGINS
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
    nationalId?: string; // National ID or Iqama number
    contactNumber?: string; // Phone number
    amountInvested: string;
    interestPercentage: string;
    notes?: string | null;
    createdAt: Date;
    investorType?: string; // "money" or "recipe"
    recipeName?: string; // Name of the recipe for recipe-type investors
    iban?: string | null; // IBAN account number
    bankName?: string | null; // Bank name
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
      // Logo is stored as "/uploads/logos/..." but files are in "public/uploads/logos/..."
      const relativePath = data.logoPath.replace(/^\/+/, '');
      const logoFullPath = path.join(process.cwd(), 'public', relativePath);
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
    ${getBasePdfStyles()}
    
    .statement-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 4mm;
    }
    
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 8px 12px;
      text-align: center;
      border-radius: 4px 4px 0 0;
      margin-bottom: 6px;
    }
    
    .company-name {
      font-size: ${PDF_STYLES.fontSize.xl};
      font-weight: 700;
      margin-bottom: 3px;
      letter-spacing: 0.3px;
    }
    
    .statement-badge {
      display: inline-block;
      background: white;
      color: #059669;
      padding: 2px 10px;
      border-radius: 8px;
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.xs};
      margin-top: 2px;
    }
    
    .section {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
      padding: 6px 8px;
      margin-bottom: 5px;
    }
    
    .section-title {
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.sm};
      color: #059669;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 1px solid #059669;
      padding-bottom: 2px;
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
      gap: 4px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
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
      font-size: ${PDF_STYLES.fontSize.sm};
    }
    
    .earnings-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    
    .earnings-table thead {
      background: #059669;
      color: white;
    }
    
    .earnings-table th {
      padding: 3px 5px;
      text-align: left;
      font-weight: 600;
      font-size: ${PDF_STYLES.fontSize.xs};
      text-transform: uppercase;
      letter-spacing: 0.2px;
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
      padding: 3px 5px;
      font-size: ${PDF_STYLES.fontSize.xs};
    }
    
    .text-right {
      text-align: right;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 8px 10px;
      border-radius: 4px;
      margin-top: 6px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      font-size: ${PDF_STYLES.fontSize.xs};
    }
    
    .summary-row:last-child {
      border-bottom: none;
      padding-top: 4px;
    }
    
    .summary-label {
      font-weight: 500;
    }
    
    .summary-value {
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.sm};
    }
    
    .total-row {
      font-size: ${PDF_STYLES.fontSize.lg};
    }
    
    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: ${PDF_STYLES.fontSize.xs};
    }
    
    .footer p {
      margin: 1px 0;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 8px;
    }
    
    .signature-box {
      width: 45%;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 1px solid #374151;
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
  <div class="statement-container pdf-container">
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
          ${investor.nationalId ? `
          <div class="info-row">
            <span class="info-label">ID (National/Iqama) / الهوية:</span>
            <span class="info-value">${escapeHtml(investor.nationalId)}</span>
          </div>
          ` : ''}
          ${investor.contactNumber ? `
          <div class="info-row">
            <span class="info-label">Contact Number / رقم التواصل:</span>
            <span class="info-value">${escapeHtml(investor.contactNumber)}</span>
          </div>
          ` : ''}
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
      ${investor.bankName || investor.iban ? `
      <div style="margin-top: 10px; padding: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;">
        <div style="font-weight: 600; color: #059669; margin-bottom: 4px; font-size: 11px;">Bank Details / تفاصيل البنك</div>
        ${investor.bankName ? `
        <div class="info-row">
          <span class="info-label">Bank Name / اسم البنك:</span>
          <span class="info-value">${escapeHtml(investor.bankName)}</span>
        </div>
        ` : ''}
        ${investor.iban ? `
        <div class="info-row">
          <span class="info-label">IBAN / رقم الآيبان:</span>
          <span class="info-value" style="font-family: monospace; letter-spacing: 1px;">${escapeHtml(investor.iban)}</span>
        </div>
        ` : ''}
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
  
  const chromiumPath = getChromiumPath();
  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--single-process',
      '--no-zygote'
    ]
  };

  if (chromiumPath) {
    launchOptions.executablePath = chromiumPath;
    console.log('[InvestorStatement] Launching fresh browser with:', chromiumPath);
  }

  const browser = await puppeteer.launch(launchOptions);
  
  try {
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: PDF_MARGINS
      });

      console.log('[InvestorStatement] PDF generated successfully');
      return Buffer.from(pdfBuffer);
    } finally {
      await page.close().catch(e => console.log('[InvestorStatement] Page close error:', e.message));
    }
  } finally {
    await browser.close().catch(e => console.log('[InvestorStatement] Browser close error:', e.message));
  }
}

// BSS Analysis Statement Data Interface
interface BssAnalysisStatementData {
  subscriptionRevenue: number;
  vatCollected: number;
  totalRevenue: number;
  totalInvoices: number;
  totalRefunds?: number;
  refundCount?: number;
  grossRevenue?: number;
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
  const companyEmail = bi.email || "IT@kinbss.org";
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
    ${getBasePdfStyles()}
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 4mm;
    }
    
    .header {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5px;
    }
    
    .company-info {
      text-align: left;
    }
    
    .company-info-ar {
      text-align: right;
      direction: rtl;
    }
    
    .company-name {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 700;
      margin-bottom: 1px;
    }
    
    .company-name-ar {
      font-size: ${PDF_STYLES.fontSize.base};
      font-weight: 600;
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .company-detail {
      font-size: ${PDF_STYLES.fontSize.xs};
      opacity: 0.9;
    }
    
    .document-title {
      text-align: center;
      padding-top: 4px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    
    .document-title h1 {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 700;
      margin-bottom: 1px;
    }
    
    .document-title h2 {
      font-size: ${PDF_STYLES.fontSize.base};
      font-weight: 600;
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .period-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 4px 8px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .period-label {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .period-value {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 600;
      color: #1e293b;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-bottom: 6px;
    }
    
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 4px 6px;
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
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      margin-bottom: 1px;
    }
    
    .metric-label-ar {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #64748b;
      font-family: 'Noto Naskh Arabic', sans-serif;
      direction: rtl;
    }
    
    .metric-value {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #1e293b;
    }
    
    .metric-value.green { color: #16a34a; }
    .metric-value.blue { color: #2563eb; }
    .metric-value.red { color: #dc2626; }
    .metric-value.purple { color: #7c3aed; }
    
    .metric-sub {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #64748b;
      margin-top: 1px;
    }
    
    .section {
      margin-bottom: 5px;
    }
    
    .section-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 3px;
      padding-bottom: 2px;
      border-bottom: 1px solid #e2e8f0;
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
  <div class="container pdf-container">
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
      margin: PDF_MARGINS
    });

    console.log('[BssAnalysis] PDF generated successfully');
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Generate Refund Clearance Invoice for subscription cancellations
interface RefundClearanceData {
  serialNumber: string;
  clientName: string;
  clientEmail: string;
  restaurantName: string;
  taxNumber: string | null;
  commercialRegistration: string | null;
  subscriptionPlan: string;
  subscriptionStartDate: Date;
  cancellationDate: Date;
  monthsUsed: number;
  originalPrice: number;
  monthlyRate: number;
  chargedAmount: number;
  refundAmount: number;
  cancellationReason?: "mistake" | "client_request";
  businessInfo?: {
    companyNameEn?: string | null;
    companyNameAr?: string | null;
    vatNumber?: string | null;
    crNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    addressEn?: string | null;
    addressAr?: string | null;
  } | null;
}

export async function generateRefundClearanceInvoice(data: RefundClearanceData): Promise<Buffer> {
  const bi = data.businessInfo || {};
  const companyNameEn = bi.companyNameEn || "BlindSpot System (BSS)";
  const companyNameAr = bi.companyNameAr || "نظام بلايند سبوت";
  const companyEmail = bi.email || "IT@kinbss.org";
  const companyPhone = bi.phone || "";
  const companyAddressEn = bi.addressEn || "Saudi Arabia";
  const companyAddressAr = bi.addressAr || "المملكة العربية السعودية";
  const companyVatNumber = bi.vatNumber || "";
  const companyCrNumber = bi.crNumber || "";

  const qrData = `Refund Clearance: ${data.serialNumber}\nDate: ${data.cancellationDate.toLocaleDateString('en-GB')}\nRefund: ${data.refundAmount.toFixed(2)} SAR`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });

  const planNames: Record<string, { en: string; ar: string }> = {
    weekly: { en: "Weekly Plan", ar: "الخطة الأسبوعية" },
    monthly: { en: "Monthly Plan", ar: "الخطة الشهرية" },
    yearly: { en: "Annual Plan", ar: "الخطة السنوية" },
  };

  const planName = planNames[data.subscriptionPlan] || { en: data.subscriptionPlan, ar: data.subscriptionPlan };

  const cancellationReasons: Record<string, { en: string; ar: string }> = {
    mistake: { en: "Mistake Subscription", ar: "اشتراك خاطئ" },
    client_request: { en: "Client Request", ar: "بناءً على طلب العميل" },
  };

  const reasonLabel = data.cancellationReason 
    ? cancellationReasons[data.cancellationReason] || { en: data.cancellationReason, ar: data.cancellationReason }
    : { en: "Not Specified", ar: "غير محدد" };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${getBasePdfStyles()}

    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 4mm;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 6px;
      border-bottom: 2px solid #dc2626;
      margin-bottom: 6px;
    }

    .header-left {
      flex: 1;
    }

    .header-right {
      flex: 1;
      text-align: right;
      direction: rtl;
    }

    .company-name {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 2px;
    }

    .company-info {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
      line-height: 1.2;
    }

    .document-title {
      text-align: center;
      margin: 6px 0;
      padding: 8px 12px;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      border-radius: 4px;
    }

    .document-title h1 {
      font-size: ${PDF_STYLES.fontSize.xl};
      font-weight: 700;
      margin-bottom: 2px;
    }

    .document-title h2 {
      font-size: ${PDF_STYLES.fontSize.lg};
      font-weight: 600;
      direction: rtl;
    }

    .section {
      margin-bottom: 6px;
    }

    .section-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
    }

    .section-title-ar {
      direction: rtl;
      color: #374151;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
    }

    .info-table td {
      padding: 3px 6px;
      border-bottom: 1px solid #e5e7eb;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .info-table .label {
      font-weight: 600;
      color: #374151;
      width: 40%;
    }

    .info-table .value {
      color: #1a1a1a;
    }

    .calculation-box {
      background: #fef2f2;
      border: 1px solid #dc2626;
      border-radius: 4px;
      padding: 8px 10px;
      margin: 6px 0;
    }

    .calculation-title {
      font-size: ${PDF_STYLES.fontSize.sm};
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 6px;
      text-align: center;
    }

    .calculation-table {
      width: 100%;
      border-collapse: collapse;
    }

    .calculation-table th {
      padding: 4px 6px;
      text-align: left;
      font-weight: 600;
      font-size: ${PDF_STYLES.fontSize.xs};
      background: #fecaca;
      border: 1px solid #dc2626;
    }

    .calculation-table th.ar {
      text-align: right;
      direction: rtl;
    }

    .calculation-table td {
      padding: 4px 6px;
      border: 1px solid #fca5a5;
      font-size: ${PDF_STYLES.fontSize.xs};
    }

    .calculation-table td.value {
      text-align: center;
      font-weight: 600;
    }

    .calculation-table tr.total {
      background: #dc2626;
      color: white;
    }

    .calculation-table tr.total td {
      font-weight: 700;
      font-size: ${PDF_STYLES.fontSize.sm};
      border-color: #dc2626;
    }

    .refund-highlight {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      color: white;
      padding: 10px 12px;
      border-radius: 4px;
      text-align: center;
      margin: 6px 0;
    }

    .refund-highlight .label {
      font-size: ${PDF_STYLES.fontSize.sm};
      margin-bottom: 3px;
    }

    .refund-highlight .amount {
      font-size: ${PDF_STYLES.fontSize.xl};
      font-weight: 700;
    }

    .footer {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .qr-section {
      text-align: center;
    }

    .qr-code {
      width: 55px;
      height: 55px;
    }

    .qr-label {
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
      margin-top: 2px;
    }

    .footer-text {
      text-align: center;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #6b7280;
      margin-top: 6px;
    }

    .zatca-badge {
      display: inline-block;
      background: #16a34a;
      color: white;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: ${PDF_STYLES.fontSize.xs};
      font-weight: 600;
      margin-bottom: 3px;
    }

    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }

    .signature-box {
      width: 45%;
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid #1a1a1a;
      margin-top: 15px;
      padding-top: 2px;
      font-size: ${PDF_STYLES.fontSize.xs};
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="container pdf-container">
    <div class="header">
      <div class="header-left">
        <div class="company-name">${escapeHtml(companyNameEn)}</div>
        <div class="company-info">
          ${companyVatNumber ? `VAT: ${escapeHtml(companyVatNumber)}<br>` : ''}
          ${companyCrNumber ? `CR: ${escapeHtml(companyCrNumber)}<br>` : ''}
          ${companyEmail ? `${escapeHtml(companyEmail)}<br>` : ''}
          ${companyPhone ? `${escapeHtml(companyPhone)}<br>` : ''}
          ${escapeHtml(companyAddressEn)}
        </div>
      </div>
      <div class="header-right">
        <div class="company-name" style="color: #1e40af;">${escapeHtml(companyNameAr)}</div>
        <div class="company-info">
          ${companyVatNumber ? `الرقم الضريبي: ${escapeHtml(companyVatNumber)}<br>` : ''}
          ${companyCrNumber ? `السجل التجاري: ${escapeHtml(companyCrNumber)}<br>` : ''}
          ${escapeHtml(companyAddressAr)}
        </div>
      </div>
    </div>

    <div class="document-title">
      <h1>REFUND CLEARANCE INVOICE</h1>
      <h2>فاتورة تصفية استرداد</h2>
    </div>

    <div class="section">
      <div class="section-title">
        <span>Document Information</span>
        <span class="section-title-ar">معلومات المستند</span>
      </div>
      <div class="info-grid">
        <table class="info-table">
          <tr>
            <td class="label">Document No.</td>
            <td class="value">${escapeHtml(data.serialNumber)}</td>
          </tr>
          <tr>
            <td class="label">Issue Date</td>
            <td class="value">${data.cancellationDate.toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td class="label">Cancellation Reason</td>
            <td class="value" style="font-weight: 600; color: ${data.cancellationReason === 'mistake' ? '#ca8a04' : '#dc2626'};">${escapeHtml(reasonLabel.en)}</td>
          </tr>
        </table>
        <table class="info-table" style="direction: rtl;">
          <tr>
            <td class="label">رقم المستند</td>
            <td class="value">${escapeHtml(data.serialNumber)}</td>
          </tr>
          <tr>
            <td class="label">تاريخ الإصدار</td>
            <td class="value">${data.cancellationDate.toLocaleDateString('ar-SA')}</td>
          </tr>
          <tr>
            <td class="label">سبب الإلغاء</td>
            <td class="value" style="font-weight: 600; color: ${data.cancellationReason === 'mistake' ? '#ca8a04' : '#dc2626'};">${escapeHtml(reasonLabel.ar)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        <span>Client Information</span>
        <span class="section-title-ar">معلومات العميل</span>
      </div>
      <div class="info-grid">
        <table class="info-table">
          <tr>
            <td class="label">Client Name</td>
            <td class="value">${escapeHtml(data.clientName)}</td>
          </tr>
          <tr>
            <td class="label">Restaurant</td>
            <td class="value">${escapeHtml(data.restaurantName)}</td>
          </tr>
          <tr>
            <td class="label">Email</td>
            <td class="value">${escapeHtml(data.clientEmail)}</td>
          </tr>
          ${data.taxNumber ? `<tr><td class="label">Tax Number</td><td class="value">${escapeHtml(data.taxNumber)}</td></tr>` : ''}
          ${data.commercialRegistration ? `<tr><td class="label">CR Number</td><td class="value">${escapeHtml(data.commercialRegistration)}</td></tr>` : ''}
        </table>
        <table class="info-table" style="direction: rtl;">
          <tr>
            <td class="label">اسم العميل</td>
            <td class="value">${escapeHtml(data.clientName)}</td>
          </tr>
          <tr>
            <td class="label">المطعم</td>
            <td class="value">${escapeHtml(data.restaurantName)}</td>
          </tr>
          <tr>
            <td class="label">البريد الإلكتروني</td>
            <td class="value">${escapeHtml(data.clientEmail)}</td>
          </tr>
          ${data.taxNumber ? `<tr><td class="label">الرقم الضريبي</td><td class="value">${escapeHtml(data.taxNumber)}</td></tr>` : ''}
          ${data.commercialRegistration ? `<tr><td class="label">السجل التجاري</td><td class="value">${escapeHtml(data.commercialRegistration)}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        <span>Subscription Details</span>
        <span class="section-title-ar">تفاصيل الاشتراك</span>
      </div>
      <div class="info-grid">
        <table class="info-table">
          <tr>
            <td class="label">Plan Type</td>
            <td class="value">${escapeHtml(planName.en)}</td>
          </tr>
          <tr>
            <td class="label">Start Date</td>
            <td class="value">${data.subscriptionStartDate.toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td class="label">Cancellation Date</td>
            <td class="value">${data.cancellationDate.toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td class="label">Months Used</td>
            <td class="value">${data.monthsUsed} months</td>
          </tr>
        </table>
        <table class="info-table" style="direction: rtl;">
          <tr>
            <td class="label">نوع الخطة</td>
            <td class="value">${escapeHtml(planName.ar)}</td>
          </tr>
          <tr>
            <td class="label">تاريخ البداية</td>
            <td class="value">${data.subscriptionStartDate.toLocaleDateString('ar-SA')}</td>
          </tr>
          <tr>
            <td class="label">تاريخ الإلغاء</td>
            <td class="value">${data.cancellationDate.toLocaleDateString('ar-SA')}</td>
          </tr>
          <tr>
            <td class="label">الأشهر المستخدمة</td>
            <td class="value">${data.monthsUsed} أشهر</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="calculation-box">
      <div class="calculation-title">
        Refund Calculation / حساب الاسترداد
      </div>
      <table class="calculation-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="ar">الوصف</th>
            <th style="text-align: center;">Amount (SAR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Original Subscription Fee</td>
            <td style="direction: rtl; text-align: right;">رسوم الاشتراك الأصلية</td>
            <td class="value">${data.originalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Monthly Rate</td>
            <td style="direction: rtl; text-align: right;">السعر الشهري</td>
            <td class="value">${data.monthlyRate.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Months Used (${data.monthsUsed} × ${data.monthlyRate.toFixed(2)})</td>
            <td style="direction: rtl; text-align: right;">(${data.monthsUsed} × ${data.monthlyRate.toFixed(2)}) الأشهر المستخدمة</td>
            <td class="value">${data.chargedAmount.toFixed(2)}</td>
          </tr>
          <tr class="total">
            <td>REFUND AMOUNT</td>
            <td style="direction: rtl; text-align: right;">مبلغ الاسترداد</td>
            <td class="value">${data.refundAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="refund-highlight">
      <div class="label">Total Refund Amount / إجمالي مبلغ الاسترداد</div>
      <div class="amount">${data.refundAmount.toFixed(2)} SAR</div>
    </div>

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">
          Authorized Signature / التوقيع المعتمد
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          Client Signature / توقيع العميل
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="qr-section">
        <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code">
        <div class="qr-label">Scan for verification</div>
      </div>
      <div style="text-align: center; flex: 1;">
        <div class="zatca-badge">ZATCA COMPLIANT | متوافق مع الزكاة</div>
        <div class="footer-text">
          This document is generated electronically and is valid without signature.<br>
          هذا المستند تم إنشاؤه إلكترونياً وهو صالح بدون توقيع.<br>
          ${escapeHtml(companyNameEn)} | ${escapeHtml(companyAddressEn)}
        </div>
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
      margin: PDF_MARGINS
    });

    console.log('[RefundClearance] PDF generated successfully');
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

function bidiText(text: string): string {
  const escaped = escapeHtml(text);
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  if (hasArabic) {
    return `<span style="unicode-bidi: embed; direction: rtl; font-family: 'Noto Naskh Arabic', 'Inter', sans-serif;">${escaped}</span>`;
  }
  return escaped;
}

function getStatementArabicStyles(): string {
  return `
    body { font-family: ${PDF_STYLES.fonts.primary}; font-size: ${PDF_STYLES.fontSize.sm}; padding: 4mm; }
    * { unicode-bidi: plaintext; }
    td, th { unicode-bidi: plaintext; }
    .ar { direction: rtl; font-family: ${PDF_STYLES.fonts.arabic}; }
    .header { text-align: center; margin-bottom: 8px; border-bottom: 2px solid ${PDF_STYLES.colors.primary}; padding-bottom: 6px; }
    .company-name { font-size: ${PDF_STYLES.fontSize.xl}; font-weight: 700; color: ${PDF_STYLES.colors.primary}; margin-bottom: 3px; }
    .document-title { font-size: ${PDF_STYLES.fontSize.lg}; font-weight: 600; color: ${PDF_STYLES.colors.textSecondary}; }
    .year { font-size: ${PDF_STYLES.fontSize.md}; color: ${PDF_STYLES.colors.textMuted}; }
    .section-header { background: #f3f4f6; font-weight: 700; font-size: ${PDF_STYLES.fontSize.md}; }
    .subsection { background: #f9fafb; font-weight: 600; }
    .indent { padding-left: 24px; color: #6b7280; }
    .positive { color: #16a34a; }
    .negative { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 16px; }
    th, td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    th { text-align: left; background: #f9fafb; font-weight: 600; }
    td:last-child, th:last-child { text-align: right; direction: ltr; }
    .footer { margin-top: 16px; text-align: center; font-size: ${PDF_STYLES.fontSize.xs}; color: ${PDF_STYLES.colors.textMuted}; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  `;
}

export async function generateIncomeStatementPDF(data: {
  companyName: string; companyVAT: string; year: string;
  revenue: number; cogs: number; grossProfit: number;
  operatingExpenses: number; operatingIncome: number; netIncome: number;
  expensesByCategory: Array<{ category: string; amount: number }>;
}): Promise<Buffer> {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    ${getBasePdfStyles()}
    ${getStatementArabicStyles()}
    .total-row { background: ${PDF_STYLES.colors.primary}; color: white; font-weight: 700; font-size: ${PDF_STYLES.fontSize.md}; }
    .subtotal-row { background: #ecfdf5; font-weight: 600; }
  </style></head><body>
    <div class="header">
      <div class="company-name">${bidiText(data.companyName)}</div>
      <div class="document-title">Income Statement (Profit & Loss) / <span class="ar">قائمة الدخل</span></div>
      <div class="year">For the Year Ending December 31, ${escapeHtml(data.year)} / <span class="ar">للسنة المنتهية في 31 ديسمبر ${escapeHtml(data.year)}</span></div>
      ${data.companyVAT ? `<div class="year">VAT: ${escapeHtml(data.companyVAT)}</div>` : ''}
    </div>
    <table>
      <thead><tr><th>Description / <span class="ar">الوصف</span></th><th>Amount (SAR) / <span class="ar">المبلغ</span></th></tr></thead>
      <tbody>
        <tr class="section-header"><td>Revenue / <span class="ar">الإيرادات</span></td><td>${data.revenue.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr><td class="indent">Sales Revenue / <span class="ar">إيرادات المبيعات</span></td><td>${data.revenue.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="section-header"><td>Cost of Goods Sold / <span class="ar">تكلفة البضاعة المباعة</span></td><td class="negative">(${data.cogs.toLocaleString('en-SA', {minimumFractionDigits: 2})})</td></tr>
        <tr class="subtotal-row"><td><strong>Gross Profit / <span class="ar">إجمالي الربح</span></strong></td><td class="${data.grossProfit >= 0 ? 'positive' : 'negative'}"><strong>${data.grossProfit.toLocaleString('en-SA', {minimumFractionDigits: 2})}</strong></td></tr>
        <tr><td class="indent" style="font-size:11px">Gross Margin / <span class="ar">هامش الربح الإجمالي</span>: ${data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : '0.0'}%</td><td></td></tr>
        <tr class="section-header"><td>Operating Expenses / <span class="ar">المصروفات التشغيلية</span></td><td class="negative">(${data.operatingExpenses.toLocaleString('en-SA', {minimumFractionDigits: 2})})</td></tr>
        ${data.expensesByCategory.map(e => `<tr><td class="indent">${bidiText(e.category)}</td><td>${e.amount.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>`).join('')}
        <tr class="section-header"><td>Operating Income / <span class="ar">الدخل التشغيلي</span></td><td class="${data.operatingIncome >= 0 ? 'positive' : 'negative'}">${data.operatingIncome.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="total-row"><td>Net Income / <span class="ar">صافي الدخل</span></td><td>${data.netIncome.toLocaleString('en-SA', {minimumFractionDigits: 2})} SAR</td></tr>
        <tr><td class="indent" style="font-size:11px">Net Margin / <span class="ar">هامش صافي الربح</span>: ${data.revenue > 0 ? ((data.netIncome / data.revenue) * 100).toFixed(1) : '0.0'}%</td><td></td></tr>
      </tbody>
    </table>
    <div class="footer"><div>BlindSpot System (BSS) - Income Statement</div><div>VAT Compliant - Saudi Arabia / <span class="ar">متوافق مع ضريبة القيمة المضافة</span></div></div>
  </body></html>`;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: PDF_MARGINS });
    return Buffer.from(pdfBuffer);
  } finally { await page.close(); }
}

export async function generateBalanceSheetPDF(data: {
  companyName: string; companyVAT: string; year: string;
  cashAndRevenue: number; inventoryValue: number; totalAssets: number;
  vatPayable: number; accountsPayable: number; totalLiabilities: number;
  ownersEquity: number;
}): Promise<Buffer> {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    ${getBasePdfStyles()}
    ${getStatementArabicStyles()}
    .total-row-blue { background: #2563eb; color: white; font-weight: 700; }
    .total-row-orange { background: #ea580c; color: white; font-weight: 700; }
    .total-row-green { background: #16a34a; color: white; font-weight: 700; }
  </style></head><body>
    <div class="header">
      <div class="company-name">${bidiText(data.companyName)}</div>
      <div class="document-title">Balance Sheet / <span class="ar">الميزانية العمومية</span></div>
      <div class="year">As of December 31, ${escapeHtml(data.year)} / <span class="ar">كما في 31 ديسمبر ${escapeHtml(data.year)}</span></div>
      ${data.companyVAT ? `<div class="year">VAT: ${escapeHtml(data.companyVAT)}</div>` : ''}
    </div>
    <table>
      <thead><tr><th>Account / <span class="ar">الحساب</span></th><th>Amount (SAR) / <span class="ar">المبلغ</span></th></tr></thead>
      <tbody>
        <tr class="section-header"><td>Assets / <span class="ar">الأصول</span></td><td></td></tr>
        <tr class="subsection"><td style="padding-left:12px">Current Assets / <span class="ar">الأصول المتداولة</span></td><td></td></tr>
        <tr><td class="indent">Cash & Revenue / <span class="ar">النقدية والإيرادات</span></td><td>${data.cashAndRevenue.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr><td class="indent">Inventory / <span class="ar">المخزون</span></td><td>${data.inventoryValue.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="total-row-blue"><td>Total Assets / <span class="ar">إجمالي الأصول</span></td><td>${data.totalAssets.toLocaleString('en-SA', {minimumFractionDigits: 2})} SAR</td></tr>
      </tbody>
    </table>
    <table>
      <tbody>
        <tr class="section-header"><td>Liabilities / <span class="ar">الالتزامات</span></td><td></td></tr>
        <tr class="subsection"><td style="padding-left:12px">Current Liabilities / <span class="ar">الالتزامات المتداولة</span></td><td></td></tr>
        <tr><td class="indent">VAT Payable (15%) / <span class="ar">ضريبة القيمة المضافة المستحقة</span></td><td>${data.vatPayable.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr><td class="indent">Accounts Payable / <span class="ar">الذمم الدائنة</span></td><td>${data.accountsPayable.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="total-row-orange"><td>Total Liabilities / <span class="ar">إجمالي الالتزامات</span></td><td>${data.totalLiabilities.toLocaleString('en-SA', {minimumFractionDigits: 2})} SAR</td></tr>
      </tbody>
    </table>
    <table>
      <tbody>
        <tr class="section-header"><td>Owner's Equity / <span class="ar">حقوق الملكية</span></td><td></td></tr>
        <tr><td class="indent">Retained Earnings / <span class="ar">الأرباح المحتجزة</span></td><td class="${data.ownersEquity >= 0 ? 'positive' : 'negative'}">${data.ownersEquity.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="total-row-green"><td>Total Equity / <span class="ar">إجمالي حقوق الملكية</span></td><td>${data.ownersEquity.toLocaleString('en-SA', {minimumFractionDigits: 2})} SAR</td></tr>
      </tbody>
    </table>
    <div class="footer"><div>BlindSpot System (BSS) - Balance Sheet</div><div>VAT Compliant - Saudi Arabia / <span class="ar">متوافق مع ضريبة القيمة المضافة</span></div></div>
  </body></html>`;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: PDF_MARGINS });
    return Buffer.from(pdfBuffer);
  } finally { await page.close(); }
}

export async function generateCashFlowPDF(data: {
  companyName: string; companyVAT: string; year: string;
  netIncome: number; inventoryAdjustments: number; accountsPayableChange: number;
  cashFromOperations: number; inventoryPurchases: number; cashFromInvesting: number;
  netCashFlow: number;
}): Promise<Buffer> {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    ${getBasePdfStyles()}
    ${getStatementArabicStyles()}
    .subtotal-row-blue { background: #eff6ff; font-weight: 600; }
    .subtotal-row-purple { background: #faf5ff; font-weight: 600; }
    .total-row { background: ${PDF_STYLES.colors.primary}; color: white; font-weight: 700; font-size: ${PDF_STYLES.fontSize.md}; }
  </style></head><body>
    <div class="header">
      <div class="company-name">${bidiText(data.companyName)}</div>
      <div class="document-title">Cash Flow Statement / <span class="ar">قائمة التدفقات النقدية</span></div>
      <div class="year">For the Year Ending December 31, ${escapeHtml(data.year)} / <span class="ar">للسنة المنتهية في 31 ديسمبر ${escapeHtml(data.year)}</span></div>
      ${data.companyVAT ? `<div class="year">VAT: ${escapeHtml(data.companyVAT)}</div>` : ''}
    </div>
    <table>
      <thead><tr><th>Description / <span class="ar">الوصف</span></th><th>Amount (SAR) / <span class="ar">المبلغ</span></th></tr></thead>
      <tbody>
        <tr class="section-header"><td>Operating Activities / <span class="ar">الأنشطة التشغيلية</span></td><td></td></tr>
        <tr><td class="indent">Net Income / <span class="ar">صافي الدخل</span></td><td class="${data.netIncome >= 0 ? 'positive' : 'negative'}">${data.netIncome.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr><td class="indent">Inventory Adjustments / <span class="ar">تعديلات المخزون</span></td><td class="positive">+${data.inventoryAdjustments.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr><td class="indent">Change in Accounts Payable / <span class="ar">التغير في الذمم الدائنة</span></td><td class="negative">-${data.accountsPayableChange.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="subtotal-row-blue"><td style="padding-left:12px"><strong>Net Cash from Operations / <span class="ar">صافي النقد من العمليات</span></strong></td><td class="${data.cashFromOperations >= 0 ? 'positive' : 'negative'}"><strong>${data.cashFromOperations.toLocaleString('en-SA', {minimumFractionDigits: 2})}</strong></td></tr>
        <tr class="section-header"><td>Investing Activities / <span class="ar">الأنشطة الاستثمارية</span></td><td></td></tr>
        <tr><td class="indent">Inventory Purchases / <span class="ar">مشتريات المخزون</span></td><td class="negative">${data.inventoryPurchases.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="subtotal-row-purple"><td style="padding-left:12px"><strong>Net Cash from Investing / <span class="ar">صافي النقد من الاستثمار</span></strong></td><td class="${data.cashFromInvesting >= 0 ? 'positive' : 'negative'}"><strong>${data.cashFromInvesting.toLocaleString('en-SA', {minimumFractionDigits: 2})}</strong></td></tr>
        <tr class="total-row"><td>Net Cash Flow / <span class="ar">صافي التدفق النقدي</span></td><td>${data.netCashFlow.toLocaleString('en-SA', {minimumFractionDigits: 2})} SAR</td></tr>
      </tbody>
    </table>
    <div class="footer"><div>BlindSpot System (BSS) - Cash Flow Statement</div><div>VAT Compliant - Saudi Arabia / <span class="ar">متوافق مع ضريبة القيمة المضافة</span></div></div>
  </body></html>`;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: PDF_MARGINS });
    return Buffer.from(pdfBuffer);
  } finally { await page.close(); }
}

export async function generateEquityStatementPDF(data: {
  companyName: string; companyVAT: string; year: string;
  beginningEquity: number; netIncome: number; ownerInvestments: number;
  ownerWithdrawals: number; endingEquity: number;
}): Promise<Buffer> {
  const netChange = data.netIncome + data.ownerInvestments - data.ownerWithdrawals;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    ${getBasePdfStyles()}
    ${getStatementArabicStyles()}
    .total-row { background: ${PDF_STYLES.colors.primary}; color: white; font-weight: 700; font-size: ${PDF_STYLES.fontSize.md}; }
    .subtotal-row-green { background: #ecfdf5; font-weight: 600; }
    .subtotal-row-red { background: #fef2f2; font-weight: 600; }
  </style></head><body>
    <div class="header">
      <div class="company-name">${bidiText(data.companyName)}</div>
      <div class="document-title">Statement of Owner's Equity / <span class="ar">قائمة حقوق الملكية</span></div>
      <div class="year">For the Year Ending December 31, ${escapeHtml(data.year)} / <span class="ar">للسنة المنتهية في 31 ديسمبر ${escapeHtml(data.year)}</span></div>
      ${data.companyVAT ? `<div class="year">VAT: ${escapeHtml(data.companyVAT)}</div>` : ''}
    </div>
    <table>
      <thead><tr><th>Description / <span class="ar">الوصف</span></th><th>Amount (SAR) / <span class="ar">المبلغ</span></th></tr></thead>
      <tbody>
        <tr class="section-header"><td>Beginning Owner's Equity / <span class="ar">رأس مال المالك في بداية الفترة</span></td><td>${data.beginningEquity.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>

        <tr class="subsection"><td style="padding-left:12px">Additions to Equity / <span class="ar">إضافات إلى حقوق الملكية</span></td><td></td></tr>
        <tr><td class="indent">Net Income / <span class="ar">صافي الدخل</span></td><td class="${data.netIncome >= 0 ? 'positive' : 'negative'}">${data.netIncome >= 0 ? '+' : ''}${data.netIncome.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr><td class="indent">Owner Investments / <span class="ar">استثمارات المالك</span></td><td class="positive">+${data.ownerInvestments.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="subtotal-row-green"><td style="padding-left:12px"><strong>Total Additions / <span class="ar">إجمالي الإضافات</span></strong></td><td class="positive"><strong>+${(data.netIncome + data.ownerInvestments).toLocaleString('en-SA', {minimumFractionDigits: 2})}</strong></td></tr>

        <tr class="subsection"><td style="padding-left:12px">Deductions from Equity / <span class="ar">خصومات من حقوق الملكية</span></td><td></td></tr>
        <tr><td class="indent">Owner Withdrawals / <span class="ar">سحوبات المالك</span></td><td class="negative">-${data.ownerWithdrawals.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="subtotal-row-red"><td style="padding-left:12px"><strong>Total Deductions / <span class="ar">إجمالي الخصومات</span></strong></td><td class="negative"><strong>-${data.ownerWithdrawals.toLocaleString('en-SA', {minimumFractionDigits: 2})}</strong></td></tr>

        <tr class="section-header"><td>Net Change in Equity / <span class="ar">صافي التغير في حقوق الملكية</span></td><td class="${netChange >= 0 ? 'positive' : 'negative'}">${netChange >= 0 ? '+' : ''}${netChange.toLocaleString('en-SA', {minimumFractionDigits: 2})}</td></tr>
        <tr class="total-row"><td>Ending Owner's Equity / <span class="ar">رأس مال المالك في نهاية الفترة</span></td><td>${data.endingEquity.toLocaleString('en-SA', {minimumFractionDigits: 2})} SAR</td></tr>
      </tbody>
    </table>
    <div class="footer"><div>BlindSpot System (BSS) - Statement of Owner's Equity</div><div>VAT Compliant - Saudi Arabia / <span class="ar">متوافق مع ضريبة القيمة المضافة</span></div></div>
  </body></html>`;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: PDF_MARGINS });
    return Buffer.from(pdfBuffer);
  } finally { await page.close(); }
}

export async function generateMealSubscriptionSchedulePDF(data: {
  subscriberName: string;
  subscriberPhone: string;
  subscriberEmail?: string;
  deliveryAddress?: string;
  dietaryNotes?: string;
  mealSelections: Array<{ name: string; price?: string }>;
  planType: string;
  scheduleDays: string[];
  mealTime: string;
  startDate: string;
  endDate?: string;
  amount: string;
  paymentStatus: string;
  restaurantName: string;
  createdAt: string;
}): Promise<Buffer> {
  const dayLabels: Record<string, { en: string; ar: string }> = {
    sunday: { en: "Sunday", ar: "الأحد" },
    monday: { en: "Monday", ar: "الاثنين" },
    tuesday: { en: "Tuesday", ar: "الثلاثاء" },
    wednesday: { en: "Wednesday", ar: "الأربعاء" },
    thursday: { en: "Thursday", ar: "الخميس" },
    friday: { en: "Friday", ar: "الجمعة" },
    saturday: { en: "Saturday", ar: "السبت" },
  };
  const mealTimeLabels: Record<string, { en: string; ar: string }> = {
    breakfast: { en: "Breakfast", ar: "فطور" },
    lunch: { en: "Lunch", ar: "غداء" },
    dinner: { en: "Dinner", ar: "عشاء" },
  };
  const planLabels: Record<string, { en: string; ar: string }> = {
    daily: { en: "Daily", ar: "يومي" },
    weekly: { en: "Weekly", ar: "أسبوعي" },
    monthly: { en: "Monthly", ar: "شهري" },
  };
  const paymentLabels: Record<string, { en: string; ar: string }> = {
    paid: { en: "Paid", ar: "مدفوع" },
    pending: { en: "Pending", ar: "قيد الانتظار" },
    partial: { en: "Partial", ar: "جزئي" },
  };

  const mealTimes = data.mealTime.split(",").map(t => t.trim());
  const mealTimeStr = mealTimes.map(t => `${mealTimeLabels[t]?.en || t} | ${mealTimeLabels[t]?.ar || t}`).join(", ");
  const daysStr = data.scheduleDays.length > 0
    ? data.scheduleDays.map(d => `${dayLabels[d]?.en || d} | ${dayLabels[d]?.ar || d}`).join(", ")
    : "Every Day | كل يوم";
  const planStr = `${planLabels[data.planType]?.en || data.planType} | ${planLabels[data.planType]?.ar || data.planType}`;
  const paymentStr = `${paymentLabels[data.paymentStatus]?.en || data.paymentStatus} | ${paymentLabels[data.paymentStatus]?.ar || data.paymentStatus}`;

  const mealsRows = data.mealSelections.map(m =>
    `<tr><td style="padding:8px;border:1px solid #ddd;">${m.name}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">${m.price ? parseFloat(m.price).toFixed(2) + ' SAR' : '-'}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    body{font-family:'Inter','Noto Naskh Arabic',sans-serif;margin:0;padding:40px;color:#1a1a1a;font-size:13px;}
    .header{text-align:center;margin-bottom:30px;border-bottom:3px solid #2563eb;padding-bottom:20px;}
    .header h1{margin:0;font-size:22px;color:#2563eb;}
    .header h2{margin:5px 0 0;font-size:14px;color:#666;}
    .section{margin-bottom:20px;}
    .section-title{font-size:15px;font-weight:700;color:#2563eb;margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:5px;}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;}
    .info-item{display:flex;justify-content:space-between;gap:8px;}
    .info-label{font-weight:600;color:#555;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th{background:#2563eb;color:white;padding:8px;text-align:left;font-weight:600;}
    th:last-child{text-align:right;}
    .total-row{background:#f0f4ff;font-weight:700;}
    .footer{margin-top:30px;text-align:center;font-size:11px;color:#888;border-top:1px solid #e5e7eb;padding-top:15px;}
  </style></head><body>
    <div class="header">
      <h1>${data.restaurantName}</h1>
      <h2>Meal Subscription Schedule | جدول اشتراك الوجبات</h2>
      <p style="margin:5px 0 0;font-size:12px;color:#888;">Date | التاريخ: ${new Date(data.createdAt).toLocaleDateString('en-GB')}</p>
    </div>
    <div class="section">
      <div class="section-title">Subscriber Information | معلومات المشترك</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Name | الاسم:</span><span>${data.subscriberName}</span></div>
        <div class="info-item"><span class="info-label">Phone | الهاتف:</span><span>${data.subscriberPhone}</span></div>
        ${data.subscriberEmail ? `<div class="info-item"><span class="info-label">Email | البريد:</span><span>${data.subscriberEmail}</span></div>` : ''}
        ${data.deliveryAddress ? `<div class="info-item"><span class="info-label">Address | العنوان:</span><span>${data.deliveryAddress}</span></div>` : ''}
      </div>
    </div>
    <div class="section">
      <div class="section-title">Subscription Details | تفاصيل الاشتراك</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Plan | الخطة:</span><span>${planStr}</span></div>
        <div class="info-item"><span class="info-label">Meal Time | وقت الوجبة:</span><span>${mealTimeStr}</span></div>
        <div class="info-item" style="grid-column:1/3;"><span class="info-label">Schedule | الجدول:</span><span style="word-break:break-word;">${daysStr}</span></div>
        <div class="info-item"><span class="info-label">Start | البداية:</span><span>${data.startDate ? new Date(data.startDate).toLocaleDateString('en-GB') : '-'}</span></div>
        <div class="info-item"><span class="info-label">End | النهاية:</span><span>${data.endDate ? new Date(data.endDate).toLocaleDateString('en-GB') : 'Open-ended | مفتوح'}</span></div>
        <div class="info-item"><span class="info-label">Payment | الدفع:</span><span>${paymentStr}</span></div>
      </div>
    </div>
    ${data.mealSelections.length > 0 ? `
    <div class="section">
      <div class="section-title">Meal Items | عناصر الوجبات</div>
      <table>
        <thead><tr><th>Item | العنصر</th><th>Price | السعر</th></tr></thead>
        <tbody>${mealsRows}
          <tr class="total-row"><td style="padding:8px;border:1px solid #ddd;">Total | الإجمالي</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">${parseFloat(data.amount).toFixed(2)} SAR</td></tr>
        </tbody>
      </table>
    </div>` : ''}
    ${data.dietaryNotes ? `<div class="section"><div class="section-title">Dietary Notes | ملاحظات غذائية</div><p>${data.dietaryNotes}</p></div>` : ''}
    <div class="footer">
      <p>${data.restaurantName} - Meal Subscription Management | إدارة اشتراكات الوجبات</p>
      <p>Powered by BSS | مدعوم من BSS</p>
    </div>
  </body></html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: PDF_MARGINS });
    return Buffer.from(pdfBuffer);
  } finally { await page.close(); }
}

// Cleanup function for graceful shutdown
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
