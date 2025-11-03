import { jsPDF } from "jspdf";
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
  invoiceId: string; // Invoice ID for QR code URL
  baseUrl: string; // Base URL of the application
}

export async function generateZATCAInvoice(data: InvoiceData): Promise<{ pdfBuffer: Buffer; qrCode: string }> {
  const doc = new jsPDF();
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate, invoiceId, baseUrl } = data;

  // ZATCA QR Code - Contains URL to view invoice
  // When scanned, the QR code will open the invoice in a browser
  const invoiceUrl = `${baseUrl}/public/invoice/${invoiceId}`;
  const qrCodeDataURL = await QRCode.toDataURL(invoiceUrl);

  // PDF Layout
  let y = 20;

  // Header - Company Name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 105, y, { align: "center" });
  y += 10;

  // Subheader - Tax Invoice (English/Arabic)
  doc.setFontSize(16);
  doc.text("Tax Invoice / فاتورة ضريبية", 105, y, { align: "center" });
  y += 15;

  // Company Details - Bilingual
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`VAT Number / الرقم الضريبي: ${companyVAT}`, 20, y);
  y += 6;
  doc.text(`Address / العنوان: ${branchAddress}`, 20, y);
  y += 6;
  doc.text(`Email / البريد الإلكتروني: ${companyEmail}`, 20, y);
  y += 6;
  doc.text(`Phone / الهاتف: ${companyPhone}`, 20, y);
  y += 10;

  // Invoice Details Box
  doc.setDrawColor(200);
  doc.rect(20, y, 170, 20);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice / فاتورة #: ${invoiceNumber}`, 25, y);
  doc.text(`Date / التاريخ: ${invoiceDate.toLocaleDateString()}`, 120, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Order / طلب #: ${order.orderNumber}`, 25, y);
  doc.text(`Type / النوع: ${order.orderType}`, 120, y);
  y += 12;

  // Customer Information (if available) - Bilingual
  if (order.customerName) {
    doc.text(`Customer / العميل: ${order.customerName}`, 20, y);
    y += 6;
  }
  if (order.table) {
    doc.text(`Table / الطاولة: ${order.table}`, 20, y);
    y += 6;
  }
  if (order.address) {
    doc.text(`Address / العنوان: ${order.address}`, 20, y);
    y += 6;
  }
  y += 4;

  // Items Table Header - Bilingual
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, 170, 10, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Item / الصنف", 22, y + 7);
  doc.text("Qty / الكمية", 115, y + 7);
  doc.text("Price / السعر", 138, y + 7);
  doc.text("Total / الإجمالي", 165, y + 7);
  y += 10;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  order.items.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.name, 22, y + 6);
    doc.text(item.quantity.toString(), 120, y + 6);
    doc.text(`${parseFloat(item.price.toString()).toFixed(2)}`, 140, y + 6);
    doc.text(`${(item.quantity * item.price).toFixed(2)}`, 170, y + 6);
    y += 6;
  });

  y += 6;

  // Totals Section - Bilingual
  doc.setDrawColor(0);
  doc.line(20, y, 190, y);
  y += 8;

  const subtotalNum = parseFloat(order.subtotal);
  const taxNum = parseFloat(order.tax);
  const totalNum = parseFloat(order.total);

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal / المجموع الفرعي:", 115, y);
  doc.text(`${subtotalNum.toFixed(2)} SAR`, 170, y);
  y += 6;

  doc.text(`VAT (15%) / ضريبة القيمة المضافة:`, 115, y);
  doc.text(`${taxNum.toFixed(2)} SAR`, 170, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total Amount / المبلغ الإجمالي:", 115, y);
  doc.text(`${totalNum.toFixed(2)} SAR`, 170, y);
  y += 12;

  // QR Code
  doc.addImage(qrCodeDataURL, 'PNG', 75, y, 60, 60);
  y += 65;

  // Footer - Bilingual
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ZATCA Compliant E-Invoice / فاتورة إلكترونية متوافقة مع هيئة الزكاة", 105, y, { align: "center" });
  y += 4;
  doc.text("Scan QR code for invoice verification / امسح رمز الاستجابة السريعة للتحقق", 105, y, { align: "center" });

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return { pdfBuffer, qrCode: invoiceUrl };
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
  const doc = new jsPDF();
  const { companyName, companyVAT, year, period, yearlyData, monthlyData } = data;
  
  let y = 20;

  // Header - Company Name
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 105, y, { align: "center" });
  y += 10;

  // Subheader
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Financial Statement / البيان المالي", 105, y, { align: "center" });
  y += 8;
  
  doc.setFontSize(12);
  doc.text(`Year ${year}`, 105, y, { align: "center" });
  y += 15;

  // Company VAT
  doc.setFontSize(10);
  doc.text(`VAT Number: ${companyVAT}`, 20, y);
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
  y += 12;

  // Summary Box
  doc.setDrawColor(100);
  doc.setFillColor(245, 247, 250);
  doc.rect(20, y, 170, 45, 'FD');
  
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Annual Summary", 25, y);
  
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Two column layout for summary
  const col1X = 25;
  const col2X = 115;
  
  doc.setFont("helvetica", "bold");
  doc.text("Total Revenue:", col1X, y);
  doc.text("VAT Collected:", col2X, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  
  const revenue = parseFloat(yearlyData.revenue);
  const vat = parseFloat(yearlyData.vat);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${revenue.toFixed(2)} SAR`, col1X, y);
  doc.text(`${vat.toFixed(2)} SAR`, col2X, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Total Transactions:", col1X, y);
  doc.text("Invoices Generated:", col2X, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  
  doc.setFontSize(11);
  doc.text(yearlyData.transactions.toString(), col1X, y);
  doc.text(yearlyData.invoices.toString(), col2X, y);
  
  y += 18;

  // Monthly Breakdown (if period is monthly and data exists)
  if (period === "monthly" && monthlyData && monthlyData.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Breakdown", 20, y);
    y += 8;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, 170, 8, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    doc.text("Month", 25, y + 6);
    doc.text("Revenue (SAR)", 90, y + 6, { align: "right" });
    doc.text("VAT (SAR)", 135, y + 6, { align: "right" });
    doc.text("Trans.", 175, y + 6, { align: "right" });
    y += 8;

    // Table Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    monthlyData.forEach((month, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        
        // Repeat header on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 170, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Month", 25, y + 6);
        doc.text("Revenue (SAR)", 90, y + 6, { align: "right" });
        doc.text("VAT (SAR)", 135, y + 6, { align: "right" });
        doc.text("Trans.", 175, y + 6, { align: "right" });
        y += 8;
        doc.setFont("helvetica", "normal");
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, y, 170, 7, 'F');
      }

      doc.text(month.month, 25, y + 5);
      doc.text(parseFloat(month.revenue).toFixed(2), 90, y + 5, { align: "right" });
      doc.text(parseFloat(month.vat).toFixed(2), 135, y + 5, { align: "right" });
      doc.text(month.transactions.toString(), 175, y + 5, { align: "right" });
      y += 7;
    });

    y += 8;

    // Monthly totals
    doc.setDrawColor(100);
    doc.line(20, y, 190, y);
    y += 6;
    
    const monthlyTotalRevenue = monthlyData.reduce((sum, m) => sum + parseFloat(m.revenue), 0);
    const monthlyTotalVAT = monthlyData.reduce((sum, m) => sum + parseFloat(m.vat), 0);
    const monthlyTotalTrans = monthlyData.reduce((sum, m) => sum + m.transactions, 0);
    
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 25, y);
    doc.text(monthlyTotalRevenue.toFixed(2), 90, y, { align: "right" });
    doc.text(monthlyTotalVAT.toFixed(2), 135, y, { align: "right" });
    doc.text(monthlyTotalTrans.toString(), 175, y, { align: "right" });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(
      `RestoPOS Financial Statement - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: "center" }
    );
    doc.text(
      `VAT Compliant - Saudi Arabia`,
      105,
      290,
      { align: "center" }
    );
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
