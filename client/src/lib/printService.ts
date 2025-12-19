/**
 * Print Service - Handles printing via QZ Tray for thermal printers
 * with fallback to browser print dialog
 *
 * QZ Tray must be installed on the client machine for direct printing.
 * Download from: https://qz.io/download/
 */

declare global {
  interface Window {
    qz: {
      websocket: {
        connect: (config?: { host?: string; port?: number }) => Promise<void>;
        disconnect: () => Promise<void>;
        isActive: () => boolean;
      };
      printers: {
        find: (name?: string) => Promise<string[]>;
        getDefault: () => Promise<string>;
      };
      print: (config: any, data: any[]) => Promise<void>;
      configs: {
        create: (printer: string | null, options?: Record<string, any>) => any;
      };
    };
  }
}

export interface PrinterConfig {
  id: string;
  name: string;
  brand: string | null;
  connectionType: string;
  ipAddress: string | null;
  isDefault: boolean;
}

export interface PrintJob {
  type: "receipt" | "invoice" | "report";
  content: string;
  printer?: PrinterConfig;
}

export interface ReceiptData {
  header?: string;
  businessName: string;
  address?: string;
  phone?: string;
  vatNumber?: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  orderNumber: string;
  date: Date;
  cashier?: string;
  footer?: string;
}

export interface PrintOptions {
  copies?: number;
  margins?: { top?: number; right?: number; bottom?: number; left?: number };
  orientation?: "portrait" | "landscape";
  size?: { width?: number; height?: number };
}

class PrintService {
  private connected = false;
  private qzAvailable = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize QZ Tray connection
   * Returns true if QZ Tray is available and connected
   */
  async init(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  /**
   * Internal initialization logic
   */
  private async doInit(): Promise<boolean> {
    // Check if QZ Tray library is loaded
    if (typeof window === "undefined" || typeof window.qz === "undefined") {
      console.log(
        "[PrintService] QZ Tray library not loaded. Falling back to browser print.",
      );
      this.qzAvailable = false;
      return false;
    }

    try {
      // Already connected?
      if (window.qz.websocket.isActive()) {
        this.connected = true;
        this.qzAvailable = true;
        return true;
      }

      // Try to connect to QZ Tray
      await window.qz.websocket.connect();
      this.connected = true;
      this.qzAvailable = true;
      console.log("[PrintService] Connected to QZ Tray");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log("[PrintService] QZ Tray not available:", errorMessage);
      this.qzAvailable = false;
      this.connected = false;
      return false;
    }
  }

  /**
   * Check if QZ Tray is available and connected
   */
  isQzAvailable(): boolean {
    return this.qzAvailable && this.connected;
  }

  /**
   * Get list of available printers from QZ Tray
   */
  async getSystemPrinters(): Promise<string[]> {
    if (!this.isQzAvailable()) {
      console.warn(
        "[PrintService] QZ Tray not available, cannot get system printers",
      );
      return [];
    }

    try {
      const printers = await window.qz.printers.find();
      return printers || [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[PrintService] Failed to get printers:", errorMessage);
      return [];
    }
  }

  /**
   * Get the system default printer
   */
  async getDefaultPrinter(): Promise<string | null> {
    if (!this.isQzAvailable()) {
      console.warn(
        "[PrintService] QZ Tray not available, cannot get default printer",
      );
      return null;
    }

    try {
      const defaultPrinter = await window.qz.printers.getDefault();
      return defaultPrinter || null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "[PrintService] Failed to get default printer:",
        errorMessage,
      );
      return null;
    }
  }

  /**
   * Print raw ESC/POS commands to a thermal printer
   */
  async printRaw(
    printerName: string,
    commands: Uint8Array | string[],
  ): Promise<boolean> {
    // Validate inputs
    if (!printerName || typeof printerName !== "string") {
      console.error("[PrintService] Invalid printer name provided");
      return false;
    }

    if (!commands || (Array.isArray(commands) && commands.length === 0)) {
      console.error("[PrintService] No print commands provided");
      return false;
    }

    if (!this.isQzAvailable()) {
      console.warn("[PrintService] QZ Tray not available for raw printing");
      return false;
    }

    try {
      const config = window.qz.configs.create(printerName);
      const printData = Array.isArray(commands) ? commands : [commands];
      await window.qz.print(config, printData);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[PrintService] Raw print failed:", errorMessage);
      return false;
    }
  }

  /**
   * Print HTML content to a printer
   */
  async printHtml(
    printerName: string,
    html: string,
    options?: PrintOptions,
  ): Promise<boolean> {
    // Validate inputs
    if (!printerName || typeof printerName !== "string") {
      console.error("[PrintService] Invalid printer name provided");
      return this.browserPrint(html);
    }

    if (!html || typeof html !== "string") {
      console.error("[PrintService] Invalid HTML content provided");
      return false;
    }

    if (!this.isQzAvailable()) {
      // Fallback to browser print
      console.log("[PrintService] QZ Tray not available, using browser print");
      return this.browserPrint(html);
    }

    try {
      const config = window.qz.configs.create(printerName, {
        copies: options?.copies || 1,
        margins: options?.margins || { top: 0, right: 0, bottom: 0, left: 0 },
        orientation: options?.orientation || "portrait",
        size: options?.size,
      });

      const data = [
        {
          type: "html",
          format: "plain",
          data: html,
        },
      ];

      await window.qz.print(config, data);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[PrintService] HTML print failed:", errorMessage);
      // Fallback to browser print
      return this.browserPrint(html);
    }
  }

  /**
   * Print a PDF file
   */
  async printPdf(printerName: string, pdfUrl: string): Promise<boolean> {
    // Validate inputs
    if (!pdfUrl || typeof pdfUrl !== "string") {
      console.error("[PrintService] Invalid PDF URL provided");
      return false;
    }

    // Validate URL format
    try {
      new URL(pdfUrl);
    } catch {
      console.error("[PrintService] Invalid PDF URL format:", pdfUrl);
      return false;
    }

    if (!this.isQzAvailable()) {
      // Open PDF in new window for browser print
      console.log(
        "[PrintService] QZ Tray not available, opening PDF in browser",
      );
      const opened = window.open(pdfUrl, "_blank");
      return opened !== null;
    }

    try {
      if (!printerName || typeof printerName !== "string") {
        console.error("[PrintService] Invalid printer name provided");
        return false;
      }

      const config = window.qz.configs.create(printerName);
      const data = [
        {
          type: "pdf",
          format: "file",
          data: pdfUrl,
        },
      ];

      await window.qz.print(config, data);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[PrintService] PDF print failed:", errorMessage);
      // Fallback: open PDF in new window
      const opened = window.open(pdfUrl, "_blank");
      return opened !== null;
    }
  }

  /**
   * Browser print fallback - opens print dialog
   */
  browserPrint(content: string): boolean {
    // Validate input
    if (!content || typeof content !== "string") {
      console.error(
        "[PrintService] Invalid content provided for browser print",
      );
      return false;
    }

    try {
      // Check if window object is available
      if (typeof window === "undefined") {
        console.error("[PrintService] Window object not available");
        return false;
      }

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        console.error("[PrintService] Failed to open print window");
        return false;
      }

      // Sanitize content to prevent XSS
      const sanitizedContent = this.sanitizeHtml(content);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Print</title>
            <style>
              @media print {
                body { margin: 0; padding: 10mm; }
              }
              body { font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            ${sanitizedContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[PrintService] Browser print failed:", errorMessage);
      return false;
    }
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  private sanitizeHtml(html: string): string {
    // Create a temporary div element
    const tempDiv = document.createElement("div");
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  }

  /**
   * Generate ESC/POS receipt data
   * This creates commands for thermal receipt printers
   */
  generateReceiptCommands(receipt: ReceiptData): string[] {
    // Validate receipt data
    if (!receipt || typeof receipt !== "object") {
      console.error("[PrintService] Invalid receipt data provided");
      return [];
    }

    if (!receipt.businessName || typeof receipt.businessName !== "string") {
      console.error("[PrintService] Business name is required");
      return [];
    }

    if (!Array.isArray(receipt.items) || receipt.items.length === 0) {
      console.error("[PrintService] Receipt must contain at least one item");
      return [];
    }

    if (typeof receipt.total !== "number" || receipt.total < 0) {
      console.error("[PrintService] Invalid total amount");
      return [];
    }

    const commands: string[] = [];
    const ESC = String.fromCharCode(27);
    const LF = String.fromCharCode(10);
    const GS = String.fromCharCode(29);

    // Initialize printer
    commands.push(ESC + "@"); // Initialize

    // Center alignment
    commands.push(ESC + "a" + String.fromCharCode(1));

    // Bold on
    commands.push(ESC + "E" + String.fromCharCode(1));

    // Business name (larger font)
    commands.push(GS + "!" + String.fromCharCode(17)); // Double height/width
    commands.push(receipt.businessName + LF);
    commands.push(GS + "!" + String.fromCharCode(0)); // Normal size

    // Bold off
    commands.push(ESC + "E" + String.fromCharCode(0));

    // Address and phone
    if (receipt.address && typeof receipt.address === "string") {
      commands.push(receipt.address + LF);
    }
    if (receipt.phone && typeof receipt.phone === "string") {
      commands.push("Tel: " + receipt.phone + LF);
    }
    if (receipt.vatNumber && typeof receipt.vatNumber === "string") {
      commands.push("VAT: " + receipt.vatNumber + LF);
    }

    // Divider
    commands.push("-".repeat(32) + LF);

    // Left alignment for items
    commands.push(ESC + "a" + String.fromCharCode(0));

    // Order details
    commands.push("Order #: " + receipt.orderNumber + LF);
    commands.push("Date: " + receipt.date.toLocaleString() + LF);
    if (receipt.cashier && typeof receipt.cashier === "string") {
      commands.push("Cashier: " + receipt.cashier + LF);
    }

    // Divider
    commands.push("-".repeat(32) + LF);

    // Items
    for (const item of receipt.items) {
      // Validate item
      if (
        !item ||
        typeof item.name !== "string" ||
        typeof item.qty !== "number" ||
        typeof item.total !== "number"
      ) {
        console.warn("[PrintService] Skipping invalid item:", item);
        continue;
      }

      const itemLine = `${item.qty}x ${item.name}`;
      const priceLine = `SAR ${item.total.toFixed(2)}`;
      const spaces = Math.max(1, 32 - itemLine.length - priceLine.length);
      commands.push(itemLine + " ".repeat(spaces) + priceLine + LF);
    }

    // Divider
    commands.push("-".repeat(32) + LF);

    // Totals
    const formatTotal = (label: string, amount: number): string => {
      const amountStr = `SAR ${amount.toFixed(2)}`;
      const spaces = Math.max(1, 32 - label.length - amountStr.length);
      return label + " ".repeat(spaces) + amountStr + LF;
    };

    commands.push(formatTotal("Subtotal:", receipt.subtotal));
    if (
      receipt.discount &&
      typeof receipt.discount === "number" &&
      receipt.discount > 0
    ) {
      commands.push(formatTotal("Discount:", -receipt.discount));
    }
    if (receipt.tax !== undefined && typeof receipt.tax === "number") {
      commands.push(formatTotal("VAT (15%):", receipt.tax));
    }

    // Bold total
    commands.push(ESC + "E" + String.fromCharCode(1));
    commands.push(formatTotal("TOTAL:", receipt.total));
    commands.push(ESC + "E" + String.fromCharCode(0));

    // Payment method
    commands.push("-".repeat(32) + LF);
    commands.push("Payment: " + receipt.paymentMethod + LF);

    // Footer
    if (receipt.footer && typeof receipt.footer === "string") {
      commands.push(LF);
      commands.push(ESC + "a" + String.fromCharCode(1)); // Center
      commands.push(receipt.footer + LF);
    }

    // Feed and cut
    commands.push(LF + LF + LF);
    commands.push(GS + "V" + String.fromCharCode(0)); // Full cut

    return commands;
  }

  /**
   * Disconnect from QZ Tray
   */
  async disconnect(): Promise<void> {
    if (
      this.connected &&
      typeof window !== "undefined" &&
      typeof window.qz !== "undefined"
    ) {
      try {
        await window.qz.websocket.disconnect();
        this.connected = false;
        console.log("[PrintService] Disconnected from QZ Tray");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("[PrintService] Failed to disconnect:", errorMessage);
      }
    }
  }

  /**
   * Reset the service (for testing or cleanup)
   */
  reset(): void {
    this.connected = false;
    this.qzAvailable = false;
    this.initPromise = null;
  }
}

// Singleton instance
export const printService = new PrintService();
