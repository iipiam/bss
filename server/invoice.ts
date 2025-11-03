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
  invoiceId: string;
  baseUrl: string;
}

export async function generateZATCAInvoice(data: InvoiceData): Promise<{ pdfBuffer: Buffer; qrCode: string }> {
  const doc = new jsPDF();
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate, invoiceId, baseUrl } = data;

  // ZATCA QR Code
  const invoiceUrl = `${baseUrl}/public/invoice/${invoiceId}`;
  const qrCodeDataURL = await QRCode.toDataURL(invoiceUrl, { width: 150, margin: 1 });

  // Color scheme - Professional blue
  const primaryColor = [41, 98, 255];
  const accentColor = [33, 150, 243];
  const lightGray = [248, 249, 250];
  const darkGray = [52, 58, 64];
  const borderColor = [222, 226, 230];

  let y = 15;
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // ============ HEADER SECTION ============
  // Top blue banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, 18, { align: "center" });

  // Tax Invoice Badge
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.roundedRect(pageWidth / 2 - 30, 24, 60, 10, 2, 2, 'FD');
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageWidth / 2, 30.5, { align: "center" });

  doc.setTextColor(0, 0, 0);
  y = 48;

  // ============ COMPANY & INVOICE INFO - TWO COLUMNS ============
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 3;
  const colWidth = (contentWidth / 2) - 3;

  // Left Column - Company Information
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(leftColX, y, colWidth, 45, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("COMPANY INFORMATION", leftColX + 3, y + 7);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  let leftY = y + 14;
  
  // VAT Number
  doc.setFont("helvetica", "bold");
  doc.text("VAT Number:", leftColX + 3, leftY);
  doc.setFont("helvetica", "normal");
  doc.text(companyVAT, leftColX + 28, leftY);
  leftY += 6;
  
  // Phone
  doc.setFont("helvetica", "bold");
  doc.text("Phone:", leftColX + 3, leftY);
  doc.setFont("helvetica", "normal");
  doc.text(companyPhone, leftColX + 28, leftY);
  leftY += 6;
  
  // Email
  doc.setFont("helvetica", "bold");
  doc.text("Email:", leftColX + 3, leftY);
  doc.setFont("helvetica", "normal");
  const emailLines = doc.splitTextToSize(companyEmail, colWidth - 30);
  doc.text(emailLines, leftColX + 28, leftY);
  leftY += (emailLines.length * 5);
  
  // Address
  doc.setFont("helvetica", "bold");
  doc.text("Address:", leftColX + 3, leftY);
  doc.setFont("helvetica", "normal");
  const addressLines = doc.splitTextToSize(branchAddress, colWidth - 6);
  doc.text(addressLines, leftColX + 3, leftY + 5);

  // Right Column - Invoice Details
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(rightColX, y, colWidth, 45, 2, 2, 'FD');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DETAILS", rightColX + 3, y + 7);
  
  doc.setFontSize(9);
  let rightY = y + 15;
  
  // Invoice Number
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", rightColX + 3, rightY);
  doc.setFontSize(11);
  doc.text(invoiceNumber, rightColX + 28, rightY);
  rightY += 7;
  
  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Date:", rightColX + 3, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceDate.toLocaleDateString('en-GB'), rightColX + 28, rightY);
  rightY += 7;
  
  // Order Number
  doc.setFont("helvetica", "bold");
  doc.text("Order No:", rightColX + 3, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(order.orderNumber, rightColX + 28, rightY);
  rightY += 7;
  
  // Order Type
  doc.setFont("helvetica", "bold");
  doc.text("Type:", rightColX + 3, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(order.orderType, rightColX + 28, rightY);

  doc.setTextColor(0, 0, 0);
  y += 53;

  // ============ CUSTOMER INFORMATION ============
  if (order.customerName || order.table || order.address) {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    
    const custInfoHeight = 12 + 
      (order.customerName ? 6 : 0) + 
      (order.table ? 6 : 0) + 
      (order.address ? 6 : 0);
    
    doc.roundedRect(margin, y, contentWidth, custInfoHeight, 2, 2, 'FD');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("CUSTOMER INFORMATION", margin + 3, y + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    let custY = y + 13;
    
    if (order.customerName) {
      doc.setFont("helvetica", "bold");
      doc.text("Customer:", margin + 3, custY);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName, margin + 25, custY);
      custY += 6;
    }
    
    if (order.table) {
      doc.setFont("helvetica", "bold");
      doc.text("Table:", margin + 3, custY);
      doc.setFont("helvetica", "normal");
      doc.text(order.table, margin + 25, custY);
      custY += 6;
    }
    
    if (order.address) {
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Address:", margin + 3, custY);
      doc.setFont("helvetica", "normal");
      const addrLines = doc.splitTextToSize(order.address, contentWidth - 40);
      doc.text(addrLines, margin + 35, custY);
    }
    
    y += custInfoHeight + 8;
  } else {
    y += 4;
  }

  // ============ ITEMS TABLE ============
  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  
  // Column headers
  doc.text("ITEM NAME", margin + 3, y + 6.5);
  doc.text("QTY", margin + 120, y + 6.5, { align: "center" });
  doc.text("PRICE (SAR)", margin + 145, y + 6.5, { align: "center" });
  doc.text("TOTAL (SAR)", contentWidth + margin - 3, y + 6.5, { align: "right" });
  
  y += 10;
  
  // Table items
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  
  order.items.forEach((item, index) => {
    // Check for page overflow
    if (y > 245) {
      doc.addPage();
      y = 20;
      
      // Repeat table header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, y, contentWidth, 10, 'FD');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM NAME", margin + 3, y + 6.5);
      doc.text("QTY", margin + 120, y + 6.5, { align: "center" });
      doc.text("PRICE (SAR)", margin + 145, y + 6.5, { align: "center" });
      doc.text("TOTAL (SAR)", contentWidth + margin - 3, y + 6.5, { align: "right" });
      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }
    
    const rowHeight = 8;
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(253, 253, 253);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    // Row border
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, y, margin + contentWidth, y);
    
    // Item data
    const itemName = doc.splitTextToSize(item.name, 110);
    doc.text(itemName[0], margin + 3, y + 5.5);
    
    doc.text(item.quantity.toString(), margin + 120, y + 5.5, { align: "center" });
    
    doc.text(parseFloat(item.price.toString()).toFixed(2), margin + 145, y + 5.5, { align: "center" });
    
    const itemTotal = (item.quantity * parseFloat(item.price.toString())).toFixed(2);
    doc.text(itemTotal, contentWidth + margin - 3, y + 5.5, { align: "right" });
    
    y += rowHeight;
  });

  // Bottom border of table
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, y, margin + contentWidth, y);
  
  y += 10;

  // ============ TOTALS SECTION ============
  const totalsX = margin + 100;
  const totalsWidth = contentWidth - 100;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Subtotal
  doc.text("Subtotal:", totalsX + 5, y);
  doc.text(`${parseFloat(order.subtotal).toFixed(2)}`, totalsX + totalsWidth - 5, y, { align: "right" });
  y += 7;
  
  // VAT
  doc.text("VAT (15%):", totalsX + 5, y);
  doc.text(`${parseFloat(order.tax).toFixed(2)}`, totalsX + totalsWidth - 5, y, { align: "right" });
  y += 2;
  
  // Line separator
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, totalsX + totalsWidth, y);
  y += 7;
  
  // Total - Highlighted
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(totalsX, y - 4, totalsWidth, 13, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL AMOUNT", totalsX + 5, y + 3);
  doc.setFontSize(14);
  doc.text(`${parseFloat(order.total).toFixed(2)} SAR`, totalsX + totalsWidth - 5, y + 3, { align: "right" });
  
  doc.setTextColor(0, 0, 0);
  y += 20;

  // ============ QR CODE SECTION ============
  const qrSize = 55;
  const qrX = (pageWidth / 2) - (qrSize / 2);
  
  // QR Code border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 4, y - 4, qrSize + 8, qrSize + 8, 3, 3, 'FD');
  
  // Add QR code
  doc.addImage(qrCodeDataURL, 'PNG', qrX, y, qrSize, qrSize);
  
  y += qrSize + 10;
  
  // QR Code instructions
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("Scan QR code to view and verify this invoice online", pageWidth / 2, y, { align: "center" });
  
  y += 12;

  // ============ FOOTER ============
  // Footer background
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(0, 277, pageWidth, 20, 'F');
  
  // ZATCA Badge
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("ZATCA COMPLIANT E-INVOICE", pageWidth / 2, 284, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("Saudi Tax Authority (ZATCA) Approved Electronic Invoice", pageWidth / 2, 289, { align: "center" });
  
  doc.setFontSize(7);
  doc.text("Thank you for your business", pageWidth / 2, 293, { align: "center" });

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
  doc.text("Financial Statement", 105, y, { align: "center" });
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

  // Monthly Breakdown
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
        
        // Repeat header
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
