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
  const invoiceUrl = `${baseUrl}/public/invoice/${invoiceId}`;
  const qrCodeDataURL = await QRCode.toDataURL(invoiceUrl, { width: 150, margin: 1 });

  // Color scheme - Professional blue
  const primaryColor = [41, 98, 255]; // RGB for primary blue
  const lightGray = [245, 247, 250];
  const darkGray = [100, 100, 100];
  const borderGray = [220, 220, 220];

  let y = 15;
  const pageWidth = 210; // A4 width in mm
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // ============ HEADER SECTION ============
  // Top colored bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Company Name - White text on blue background
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, 15, { align: "center" });

  // Tax Invoice badge - English and Arabic
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("TAX INVOICE", 50, 25);
  doc.text("فاتورة ضريبية", pageWidth - 50, 25, { align: "right" });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y = 45;

  // ============ COMPANY & INVOICE INFO SECTION ============
  // Two-column layout: Company info on left, Invoice info on right
  
  // Left column - Company Details
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(margin, y, (contentWidth / 2) - 3, 42, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("COMPANY INFORMATION | معلومات الشركة", margin + 3, y + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  let leftY = y + 12;
  doc.setFont("helvetica", "bold");
  doc.text("VAT No. | الرقم الضريبي:", margin + 3, leftY);
  doc.setFont("helvetica", "normal");
  doc.text(companyVAT, margin + 50, leftY);
  
  leftY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Address | العنوان:", margin + 3, leftY);
  doc.setFont("helvetica", "normal");
  const addressLines = doc.splitTextToSize(branchAddress, 50);
  doc.text(addressLines, margin + 3, leftY + 5);
  
  leftY += (addressLines.length * 5) + 3;
  doc.setFont("helvetica", "bold");
  doc.text("Email | البريد:", margin + 3, leftY);
  doc.setFont("helvetica", "normal");
  doc.text(companyEmail, margin + 3, leftY + 5);
  
  // Right column - Invoice Details
  const rightX = pageWidth / 2 + 3;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(rightX, y, (contentWidth / 2) - 3, 42, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DETAILS | تفاصيل الفاتورة", rightX + 3, y + 6);
  
  let rightY = y + 14;
  doc.setFontSize(10);
  doc.text("Invoice No. | رقم الفاتورة:", rightX + 3, rightY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(invoiceNumber, rightX + 50, rightY);
  
  rightY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Date | التاريخ:", rightX + 3, rightY);
  doc.text(invoiceDate.toLocaleDateString('en-GB'), rightX + 50, rightY);
  
  rightY += 8;
  doc.text("Order No. | رقم الطلب:", rightX + 3, rightY);
  doc.text(order.orderNumber, rightX + 50, rightY);
  
  rightY += 8;
  doc.text("Type | النوع:", rightX + 3, rightY);
  doc.text(order.orderType, rightX + 50, rightY);

  doc.setTextColor(0, 0, 0);
  y += 50;

  // ============ CUSTOMER INFORMATION SECTION ============
  if (order.customerName || order.table || order.address) {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    const customerHeight = 8 + (order.customerName ? 6 : 0) + (order.table ? 6 : 0) + (order.address ? 6 : 0);
    doc.roundedRect(margin, y, contentWidth, customerHeight, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("CUSTOMER INFORMATION | معلومات العميل", margin + 3, y + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    let custY = y + 6;
    
    if (order.customerName) {
      custY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Customer | العميل:", margin + 3, custY);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName, margin + 35, custY);
    }
    
    if (order.table) {
      custY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Table | الطاولة:", margin + 3, custY);
      doc.setFont("helvetica", "normal");
      doc.text(order.table, margin + 35, custY);
    }
    
    if (order.address) {
      custY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Address | العنوان:", margin + 3, custY);
      doc.setFont("helvetica", "normal");
      doc.text(order.address, margin + 35, custY);
    }
    
    y += customerHeight + 8;
  } else {
    y += 6;
  }

  // ============ ITEMS TABLE ============
  // Table header with gradient effect
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, y, contentWidth, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  
  // Column headers - Bilingual
  doc.text("ITEM NAME", margin + 3, y + 6.5);
  doc.text("الصنف", margin + 3, y + 6.5 + 3, { maxWidth: 40 });
  
  doc.text("QTY", margin + 105, y + 6.5, { align: "center" });
  doc.text("الكمية", margin + 105, y + 6.5 + 3, { align: "center" });
  
  doc.text("PRICE", margin + 130, y + 6.5, { align: "center" });
  doc.text("السعر", margin + 130, y + 6.5 + 3, { align: "center" });
  
  doc.text("TOTAL", margin + 165, y + 6.5, { align: "right" });
  doc.text("المجموع", margin + 165, y + 6.5 + 3, { align: "right" });
  
  y += 10;
  
  // Table border
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.5);
  
  // Items rows with alternating colors
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  order.items.forEach((item, index) => {
    // Check for page overflow
    if (y > 250) {
      doc.addPage();
      y = 20;
      
      // Repeat table header on new page
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM NAME | الصنف", margin + 3, y + 6.5);
      doc.text("QTY | الكمية", margin + 105, y + 6.5, { align: "center" });
      doc.text("PRICE | السعر", margin + 130, y + 6.5, { align: "center" });
      doc.text("TOTAL | المجموع", margin + 165, y + 6.5, { align: "right" });
      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }
    
    const rowHeight = 8;
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    // Draw row borders
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.rect(margin, y, contentWidth, rowHeight);
    
    // Item data
    const itemName = doc.splitTextToSize(item.name, 95);
    doc.text(itemName[0], margin + 3, y + 5.5);
    
    doc.text(item.quantity.toString(), margin + 105, y + 5.5, { align: "center" });
    
    doc.text(`${parseFloat(item.price.toString()).toFixed(2)}`, margin + 130, y + 5.5, { align: "center" });
    
    const itemTotal = (item.quantity * parseFloat(item.price.toString())).toFixed(2);
    doc.text(`${itemTotal}`, margin + 165, y + 5.5, { align: "right" });
    
    y += rowHeight;
  });

  // Close table border
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin, y, margin + contentWidth, y);
  
  y += 8;

  // ============ TOTALS SECTION ============
  const totalsX = margin + 105;
  const totalsWidth = contentWidth - 105;
  
  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subtotal | المجموع الفرعي:", totalsX + 5, y);
  doc.text(`${parseFloat(order.subtotal).toFixed(2)} SAR`, totalsX + totalsWidth - 5, y, { align: "right" });
  y += 7;
  
  // VAT
  doc.text("VAT (15%) | ضريبة القيمة المضافة:", totalsX + 5, y);
  doc.text(`${parseFloat(order.tax).toFixed(2)} SAR`, totalsX + totalsWidth - 5, y, { align: "right" });
  y += 2;
  
  // Separator line
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, totalsX + totalsWidth, y);
  y += 6;
  
  // Total - Highlighted
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(totalsX, y - 4, totalsWidth, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL AMOUNT", totalsX + 5, y + 3);
  doc.text("المبلغ الإجمالي", totalsX + 5, y + 7);
  doc.setFontSize(14);
  doc.text(`${parseFloat(order.total).toFixed(2)} SAR`, totalsX + totalsWidth - 5, y + 5, { align: "right" });
  
  doc.setTextColor(0, 0, 0);
  y += 20;

  // ============ QR CODE & FOOTER SECTION ============
  // QR Code with border and label
  const qrSize = 50;
  const qrX = (pageWidth / 2) - (qrSize / 2);
  
  // QR Code background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 3, y - 3, qrSize + 6, qrSize + 6, 2, 2, 'FD');
  
  // Add QR code
  doc.addImage(qrCodeDataURL, 'PNG', qrX, y, qrSize, qrSize);
  
  y += qrSize + 8;
  
  // QR Code instructions
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("Scan QR code to view and verify invoice online", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text("امسح رمز الاستجابة السريعة لعرض الفاتورة والتحقق منها", pageWidth / 2, y, { align: "center" });
  
  y += 10;

  // ============ FOOTER ============
  // Footer bar
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(0, 280, pageWidth, 17, 'F');
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("ZATCA COMPLIANT E-INVOICE", pageWidth / 2, 286, { align: "center" });
  doc.text("فاتورة إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك", pageWidth / 2, 290, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("Thank you for your business | شكراً لتعاملكم معنا", pageWidth / 2, 294, { align: "center" });

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
