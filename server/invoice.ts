import puppeteer from "puppeteer";
import QRCode from "qrcode";
import type { Order } from "@shared/schema";

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
}

function generateBilingualInvoiceHTML(data: InvoiceData, qrCodeDataURL: string): string {
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate } = data;
  
  const subtotal = parseFloat(order.subtotal);
  const tax = parseFloat(order.tax);
  const total = parseFloat(order.total);

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
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin-bottom: 20px;
    }
    
    .company-name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    
    .invoice-badge {
      display: inline-block;
      background: white;
      color: #2962ff;
      padding: 8px 24px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
      margin-top: 8px;
    }
    
    .bilingual-section {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .section-left, .section-right {
      flex: 1;
      padding: 20px;
      border-radius: 8px;
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
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 11px;
    }
    
    .section-right .info-row {
      flex-direction: row-reverse;
      text-align: right;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 100px;
      color: #374151;
    }
    
    .info-value {
      color: #1a1a1a;
    }
    
    .customer-section {
      background: #f8f9fa;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .items-table thead {
      background: #2962ff;
      color: white;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      padding: 10px 12px;
      font-size: 11px;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals-section {
      max-width: 400px;
      margin-left: auto;
      margin-bottom: 30px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 12px;
    }
    
    .totals-row.total {
      background: #2962ff;
      color: white;
      font-weight: 700;
      font-size: 16px;
      border-radius: 8px;
      padding: 15px 20px;
      margin-top: 10px;
    }
    
    .totals-row.subtotal {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .qr-section {
      text-align: center;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .qr-code {
      width: 150px;
      height: 150px;
      margin: 0 auto 10px;
      border: 3px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px;
    }
    
    .qr-instruction {
      font-size: 10px;
      color: #6b7280;
      margin-top: 8px;
    }
    
    .qr-instruction-ar {
      font-size: 10px;
      color: #6b7280;
      direction: rtl;
      margin-top: 4px;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .zatca-badge {
      color: #2962ff;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 6px;
    }
    
    .footer-text {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 4px;
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
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-name english">${companyName}</div>
      <div class="invoice-badge">TAX INVOICE | فاتورة ضريبية</div>
    </div>
    
    <!-- Company Information - Bilingual -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english">
        <div class="section-title">Company Information</div>
        <div class="info-row">
          <div class="info-label">VAT Number:</div>
          <div class="info-value">${companyVAT}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone:</div>
          <div class="info-value">${companyPhone}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${companyEmail}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Address:</div>
          <div class="info-value">${branchAddress}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">معلومات الشركة</div>
        <div class="info-row">
          <div class="info-value">${companyVAT}</div>
          <div class="info-label">:الرقم الضريبي</div>
        </div>
        <div class="info-row">
          <div class="info-value">${companyPhone}</div>
          <div class="info-label">:الهاتف</div>
        </div>
        <div class="info-row">
          <div class="info-value">${companyEmail}</div>
          <div class="info-label">:البريد الإلكتروني</div>
        </div>
        <div class="info-row">
          <div class="info-value">${branchAddress}</div>
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
          <div class="info-value">${invoiceNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Date:</div>
          <div class="info-value">${invoiceDate.toLocaleDateString('en-GB')}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Order No:</div>
          <div class="info-value">${order.orderNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Type:</div>
          <div class="info-value">${order.orderType}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">تفاصيل الفاتورة</div>
        <div class="info-row">
          <div class="info-value">${invoiceNumber}</div>
          <div class="info-label">:رقم الفاتورة</div>
        </div>
        <div class="info-row">
          <div class="info-value">${invoiceDate.toLocaleDateString('ar-SA')}</div>
          <div class="info-label">:التاريخ</div>
        </div>
        <div class="info-row">
          <div class="info-value">${order.orderNumber}</div>
          <div class="info-label">:رقم الطلب</div>
        </div>
        <div class="info-row">
          <div class="info-value">${order.orderType}</div>
          <div class="info-label">:النوع</div>
        </div>
      </div>
    </div>
    
    ${order.customerName || order.table || order.address ? `
    <!-- Customer Information -->
    <div class="customer-section">
      <div style="display: flex; gap: 40px;">
        <div class="english" style="flex: 1;">
          <div class="section-title">Customer Information</div>
          ${order.customerName ? `<div class="info-row"><div class="info-label">Customer:</div><div class="info-value">${order.customerName}</div></div>` : ''}
          ${order.table ? `<div class="info-row"><div class="info-label">Table:</div><div class="info-value">${order.table}</div></div>` : ''}
          ${order.address ? `<div class="info-row"><div class="info-label">Delivery Address:</div><div class="info-value">${order.address}</div></div>` : ''}
        </div>
        <div class="arabic" style="flex: 1; direction: rtl; text-align: right;">
          <div class="section-title">معلومات العميل</div>
          ${order.customerName ? `<div class="info-row"><div class="info-value">${order.customerName}</div><div class="info-label">:العميل</div></div>` : ''}
          ${order.table ? `<div class="info-row"><div class="info-value">${order.table}</div><div class="info-label">:الطاولة</div></div>` : ''}
          ${order.address ? `<div class="info-row"><div class="info-value">${order.address}</div><div class="info-label">:عنوان التوصيل</div></div>` : ''}
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
          <th class="text-center english">PRICE (SAR)</th>
          <th class="text-center english">TOTAL (SAR)</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td class="english">${item.name}</td>
            <td class="text-right arabic">${item.name}</td>
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
    
    <!-- QR Code -->
    <div class="qr-section">
      <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code">
      <div class="qr-instruction english">Scan QR code to view and verify this invoice online</div>
      <div class="qr-instruction-ar arabic">امسح رمز الاستجابة السريعة لعرض الفاتورة والتحقق منها عبر الإنترنت</div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="zatca-badge">ZATCA COMPLIANT E-INVOICE | فاتورة إلكترونية متوافقة مع هيئة الزكاة</div>
      <div class="footer-text english">Saudi Tax Authority (ZATCA) Approved Electronic Invoice</div>
      <div class="footer-text arabic">فاتورة إلكترونية معتمدة من هيئة الزكاة والضريبة والجمارك</div>
      <div class="footer-text english" style="margin-top: 8px;">Thank you for your business | شكراً لتعاملكم معنا</div>
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

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
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

    return { pdfBuffer: Buffer.from(pdfBuffer), qrCode: invoiceUrl };
  } finally {
    await browser.close();
  }
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
    <div class="company-name">${companyName}</div>
    <div class="document-title">Financial Statement</div>
    <div class="year">Year ${year}</div>
  </div>
  
  <div class="meta-info">
    <div>VAT Number: ${companyVAT}</div>
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
            <td>${month.month}</td>
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
    <div>RestoPOS Financial Statement</div>
    <div>VAT Compliant - Saudi Arabia</div>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
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
    await browser.close();
  }
}
