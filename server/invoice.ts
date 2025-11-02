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
}

export async function generateZATCAInvoice(data: InvoiceData): Promise<{ pdfBuffer: Buffer; qrCode: string }> {
  const doc = new jsPDF();
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate } = data;

  // ZATCA QR Code Data
  // TLV Format (Tag-Length-Value) for ZATCA compliance
  const sellerName = Buffer.from(companyName, 'utf8');
  const vatNumber = Buffer.from(companyVAT, 'utf8');
  const timestamp = Buffer.from(invoiceDate.toISOString(), 'utf8');
  const totalWithVAT = Buffer.from(order.total, 'utf8');
  const vatAmount = Buffer.from(order.tax, 'utf8');

  // Build TLV encoded data
  const tlvData = Buffer.concat([
    Buffer.from([0x01, sellerName.length]), sellerName,
    Buffer.from([0x02, vatNumber.length]), vatNumber,
    Buffer.from([0x03, timestamp.length]), timestamp,
    Buffer.from([0x04, totalWithVAT.length]), totalWithVAT,
    Buffer.from([0x05, vatAmount.length]), vatAmount,
  ]);

  const qrDataBase64 = tlvData.toString('base64');
  const qrCodeDataURL = await QRCode.toDataURL(qrDataBase64);

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

  // Company Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`VAT Number: ${companyVAT}`, 20, y);
  y += 6;
  doc.text(`Address: ${branchAddress}`, 20, y);
  y += 6;
  doc.text(`Email: ${companyEmail}`, 20, y);
  y += 6;
  doc.text(`Phone: ${companyPhone}`, 20, y);
  y += 10;

  // Invoice Details Box
  doc.setDrawColor(200);
  doc.rect(20, y, 170, 20);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice #: ${invoiceNumber}`, 25, y);
  doc.text(`Date: ${invoiceDate.toLocaleDateString()}`, 120, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Order #: ${order.orderNumber}`, 25, y);
  doc.text(`Order Type: ${order.orderType}`, 120, y);
  y += 12;

  // Customer Information (if available)
  if (order.customerName) {
    doc.text(`Customer: ${order.customerName}`, 20, y);
    y += 6;
  }
  if (order.table) {
    doc.text(`Table: ${order.table}`, 20, y);
    y += 6;
  }
  if (order.address) {
    doc.text(`Address: ${order.address}`, 20, y);
    y += 6;
  }
  y += 4;

  // Items Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("Item", 22, y + 6);
  doc.text("Qty", 120, y + 6);
  doc.text("Price", 140, y + 6);
  doc.text("Total", 170, y + 6);
  y += 8;

  // Items
  doc.setFont("helvetica", "normal");
  order.items.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.name, 22, y + 6);
    doc.text(item.quantity.toString(), 120, y + 6);
    doc.text(`${parseFloat(item.price.toString()).toFixed(2)} SAR`, 140, y + 6);
    doc.text(`${(item.quantity * item.price).toFixed(2)} SAR`, 170, y + 6);
    y += 6;
  });

  y += 6;

  // Totals Section
  doc.setDrawColor(0);
  doc.line(20, y, 190, y);
  y += 8;

  const subtotalNum = parseFloat(order.subtotal);
  const taxNum = parseFloat(order.tax);
  const totalNum = parseFloat(order.total);

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 130, y);
  doc.text(`${subtotalNum.toFixed(2)} SAR`, 170, y);
  y += 6;

  doc.text(`VAT (15%):`, 130, y);
  doc.text(`${taxNum.toFixed(2)} SAR`, 170, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total Amount:", 130, y);
  doc.text(`${totalNum.toFixed(2)} SAR`, 170, y);
  y += 12;

  // QR Code
  doc.addImage(qrCodeDataURL, 'PNG', 75, y, 60, 60);
  y += 65;

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ZATCA Compliant E-Invoice", 105, y, { align: "center" });
  y += 4;
  doc.text("Scan QR code for invoice verification", 105, y, { align: "center" });

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return { pdfBuffer, qrCode: qrDataBase64 };
}
