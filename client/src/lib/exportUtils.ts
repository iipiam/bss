import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { format } from "date-fns";

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

const sanitizeFileName = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

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

const hasArabic = (text: string): boolean => {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

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
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided for PDF export" };
    }

    if (!columns || columns.length === 0) {
      return { success: false, error: "No columns configured for PDF export" };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: "PDF title is required" };
    }

    const allValues: string[] = [];
    data.forEach((row) => {
      columns.forEach((col) => {
        let value = "";
        try {
          value = typeof col.accessor === "function"
            ? String(col.accessor(row))
            : String((row as any)[col.accessor] ?? "");
        } catch (e) { /* skip */ }
        allValues.push(value);
      });
      columns.forEach((col) => allValues.push(col.header));
    });
    if (title) allValues.push(title);
    if (options?.subtitle) allValues.push(options.subtitle);

    const needsArabicFont = allValues.some(hasArabic);

    const fontLink = needsArabicFont
      ? `<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Inter:wght@400;700&display=swap" rel="stylesheet">`
      : "";
    const fontFamily = needsArabicFont
      ? "'Noto Naskh Arabic', 'Inter', Arial, sans-serif"
      : "'Inter', Arial, Helvetica, sans-serif";

    const orientation = options?.orientation || "landscape";
    const exportDate = format(new Date(), "dd/MM/yyyy HH:mm");

    const totalSpecifiedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const colWidthsPercent = columns.map((col) => {
      if (col.width && totalSpecifiedWidth > 0) {
        return (col.width / totalSpecifiedWidth) * 100;
      }
      return 100 / columns.length;
    });

    let rowsHtml = "";
    data.forEach((row, rowIndex) => {
      let cellsHtml = "";
      columns.forEach((col, colIdx) => {
        let value: string | number = "";
        try {
          value = typeof col.accessor === "function"
            ? col.accessor(row)
            : (row as any)[col.accessor] ?? "";
        } catch (e) {
          value = "";
        }
        const text = value?.toString() || "";
        const isAr = hasArabic(text);
        const dir = isAr ? ' dir="rtl" style="text-align:right;"' : "";
        cellsHtml += `<td${dir}>${escapeHtml(text)}</td>`;
      });
      const bg = rowIndex % 2 === 0 ? ' style="background:#fafafa;"' : "";
      rowsHtml += `<tr${bg}>${cellsHtml}</tr>`;
    });

    let headerCellsHtml = "";
    columns.forEach((col, i) => {
      headerCellsHtml += `<th style="width:${colWidthsPercent[i].toFixed(1)}%;">${escapeHtml(col.header)}</th>`;
    });

    const subtitleHtml = options?.subtitle
      ? `<p style="margin:0 0 2px;font-size:10px;color:#555;">${escapeHtml(options.subtitle)}</p>`
      : "";

    const titleDir = hasArabic(title) ? ' dir="rtl"' : '';

    const html = `
      <div id="pdf-export-container" style="font-family:${fontFamily};color:#222;padding:0;margin:0;width:100%;">
        <h1 style="font-size:16px;margin:0 0 4px;font-weight:700;"${titleDir}>${escapeHtml(title)}</h1>
        ${subtitleHtml}
        <p style="margin:0 0 8px;font-size:9px;color:#888;">Exported: ${exportDate}</p>
        <table style="width:100%;border-collapse:collapse;font-size:8px;">
          <thead>
            <tr style="background:#f0f0f0;">${headerCellsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    if (needsArabicFont) {
      const linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Inter:wght@400;700&display=swap";
      document.head.appendChild(linkEl);
    }
    document.body.appendChild(container);

    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    const sanitizedTitle = sanitizeFileName(title);
    const fileName = `${sanitizedTitle}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;

    const el = container.querySelector("#pdf-export-container") as HTMLElement;

    const renderTimeout = needsArabicFont ? 1500 : 300;

    setTimeout(() => {
      doc.html(el, {
        callback: function (doc) {
          const pageCount = doc.getNumberOfPages();
          const pageHeight = doc.internal.pageSize.getHeight();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 5);
          }
          doc.save(fileName);
          document.body.removeChild(container);
        },
        x: margin,
        y: 0,
        width: contentWidth,
        windowWidth: orientation === "landscape" ? 1100 : 800,
        autoPaging: "text",
      });
    }, renderTimeout);

    return { success: true, fileName };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("PDF export error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

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
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided for Excel export" };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: "Excel title is required" };
    }

    const ws = XLSX.utils.json_to_sheet(data);

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

    const wb = XLSX.utils.book_new();
    const sheetName = getValidSheetName(
      options?.sheetName || title.substring(0, 31)
    );
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    let finalFileName = fileName;
    if (!finalFileName) {
      const sanitizedTitle = sanitizeFileName(title);
      finalFileName = `${sanitizedTitle}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
    } else {
      if (!finalFileName.endsWith(".xlsx")) {
        finalFileName = `${finalFileName}.xlsx`;
      }
    }

    XLSX.writeFile(wb, finalFileName);

    return { success: true, fileName: finalFileName };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("Excel export error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
