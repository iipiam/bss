import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => string | number);
  width?: number;
}

export function exportToPDF(
  title: string,
  data: any[],
  columns: ExportColumn[],
  options?: {
    subtitle?: string;
    orientation?: "portrait" | "landscape";
  }
) {
  try {
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
    if (options?.subtitle) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(options.subtitle, margin, yPosition);
      yPosition += 8;
    }

    // Add export date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Exported: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, margin, yPosition);
    yPosition += 10;

    // Calculate column widths
    const totalWidth = pageWidth - 2 * margin;
    const colWidths = columns.map((col) => col.width || totalWidth / columns.length);

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
        const value =
          typeof col.accessor === "function"
            ? col.accessor(row)
            : row[col.accessor];
        const text = value?.toString() || "";
        doc.text(text, xPosition + 2, yPosition + 5, {
          maxWidth: colWidths[i] - 4,
        });
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

    // Save the PDF
    const fileName = `${title.toLowerCase().replace(/\s+/g, "_")}_${format(
      new Date(),
      "yyyyMMdd_HHmmss"
    )}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("PDF export error:", error);
    return { success: false, error };
  }
}

export function exportToExcel(
  title: string,
  data: any[],
  fileName?: string,
  options?: {
    sheetName?: string;
    headers?: string[];
  }
) {
  try {
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => {
          const value = row[key];
          return value?.toString().length || 0;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws["!cols"] = colWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      options?.sheetName || title.substring(0, 31)
    );

    // Generate file name
    const finalFileName =
      fileName ||
      `${title.toLowerCase().replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;

    // Write file
    XLSX.writeFile(wb, finalFileName);

    return { success: true, fileName: finalFileName };
  } catch (error) {
    console.error("Excel export error:", error);
    return { success: false, error };
  }
}
