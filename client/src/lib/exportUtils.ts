import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { format } from "date-fns";

// Type definitions
interface ExportColumn<T = Record<string, any>> {
  header: string;
  accessor: string | ((row: T) => string | number);
  width?: number;
}

interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

// Helper function to sanitize file names
const sanitizeFileName = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

// Helper function to validate sheet name length
const getValidSheetName = (name: string): string => {
  const maxLength = 31;
  if (name.length > maxLength) {
    console.warn(
      `Sheet name "${name}" exceeds 31 characters, truncating...`
    );
    return name.substring(0, maxLength);
  }
  return name;
};

/**
 * Export data to PDF format with customizable columns and styling
 * @param title - The title of the PDF document
 * @param data - Array of data objects to export
 * @param columns - Column configuration array
 * @param options - Optional configuration (subtitle, orientation)
 * @returns Export result with success status and file name or error
 */
export function exportToPDF<T = Record<string, any>>(
  title: string,
  data: T[],
  columns: ExportColumn<T>[],
  options?: {
    subtitle?: string;
    orientation?: "portrait" | "landscape";
  }
): ExportResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided for PDF export" };
    }

    if (!columns || columns.length === 0) {
      return { success: false, error: "No columns configured for PDF export" };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: "PDF title is required" };
    }

    const doc = new jsPDF({
      orientation: options?.orientation || "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = margin;

    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPosition);
    yPosition += 10;

    // Add subtitle if provided
    if (options?.subtitle && options.subtitle.trim().length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(options.subtitle, margin, yPosition);
      yPosition += 8;
    }

    // Add export date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Exported: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      margin,
      yPosition
    );
    yPosition += 10;

    // Calculate column widths with validation
    const totalWidth = pageWidth - 2 * margin;
    let colWidths = columns.map((col) => col.width || totalWidth / columns.length);

    // Validate and normalize widths if they exceed total width
    const totalSpecified = colWidths.reduce((a, b) => a + b, 0);
    if (totalSpecified > totalWidth) {
      console.warn("Column widths exceed page width, normalizing...");
      colWidths = colWidths.map((w) => (w / totalSpecified) * totalWidth);
    }

    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, totalWidth, 8, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    let xPosition = margin;
    columns.forEach((col, i) => {
      doc.text(col.header, xPosition + 2, yPosition + 5);
      xPosition += colWidths[i];
    });

    yPosition += 8;

    // Draw table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;

        // Redraw header on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, totalWidth, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);

        xPosition = margin;
        columns.forEach((col, i) => {
          doc.text(col.header, xPosition + 2, yPosition + 5);
          xPosition += colWidths[i];
        });

        yPosition += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition, totalWidth, 7, "F");
      }

      xPosition = margin;
      columns.forEach((col, i) => {
        let value: string | number = "";

        try {
          value =
            typeof col.accessor === "function"
              ? col.accessor(row)
              : (row as any)[col.accessor] ?? "";
        } catch (e) {
          console.warn(`Failed to access column ${col.header}:`, e);
          value = "";
        }

        const text = value?.toString() || "";

        // Handle text overflow with line wrapping
        const lines = doc.splitTextToSize(text, colWidths[i] - 4);
        doc.text(lines, xPosition + 2, yPosition + 5);

        xPosition += colWidths[i];
      });

      yPosition += 7;
    });

    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin - 20,
        pageHeight - 5
      );
    }

    // Save the PDF with sanitized filename
    const sanitizedTitle = sanitizeFileName(title);
    const fileName = `${sanitizedTitle}_${format(
      new Date(),
      "yyyyMMdd_HHmmss"
    )}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("PDF export error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Export data to Excel format with auto-sized columns
 * @param title - The title/sheet name for the Excel file
 * @param data - Array of data objects to export
 * @param fileName - Optional custom file name (without extension)
 * @param options - Optional configuration (sheetName, headers)
 * @returns Export result with success status and file name or error
 */
export function exportToExcel<T = Record<string, any>>(
  title: string,
  data: T[],
  fileName?: string,
  options?: {
    sheetName?: string;
    headers?: string[];
  }
): ExportResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided for Excel export" };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: "Excel title is required" };
    }

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] as Record<string, any>).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => {
          const value = (row as any)[key];
          return value?.toString().length || 0;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws["!cols"] = colWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    const sheetName = getValidSheetName(
      options?.sheetName || title.substring(0, 31)
    );
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate file name with proper validation
    let finalFileName = fileName;
    if (!finalFileName) {
      const sanitizedTitle = sanitizeFileName(title);
      finalFileName = `${sanitizedTitle}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
    } else {
      // Ensure .xlsx extension
      if (!finalFileName.endsWith(".xlsx")) {
        finalFileName = `${finalFileName}.xlsx`;
      }
    }

    // Write file
    XLSX.writeFile(wb, finalFileName);

    return { success: true, fileName: finalFileName };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("Excel export error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
