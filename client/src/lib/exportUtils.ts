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

    const orientation = options?.orientation || "landscape";
    const exportDate = format(new Date(), "dd/MM/yyyy HH:mm");
    const pageSize = orientation === "landscape" ? "@page { size: A4 landscape; margin: 10mm; }" : "@page { size: A4 portrait; margin: 10mm; }";

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
      columns.forEach((col) => {
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
        const dirStyle = isAr ? ' dir="rtl" style="text-align:right;font-family:\'Noto Naskh Arabic\',\'Inter\',sans-serif;"' : "";
        cellsHtml += `<td${dirStyle}>${escapeHtml(text)}</td>`;
      });
      const bgClass = rowIndex % 2 === 0 ? ' class="alt-row"' : "";
      rowsHtml += `<tr${bgClass}>${cellsHtml}</tr>`;
    });

    let headerCellsHtml = "";
    columns.forEach((col, i) => {
      headerCellsHtml += `<th style="width:${colWidthsPercent[i].toFixed(1)}%;">${escapeHtml(col.header)}</th>`;
    });

    const subtitleHtml = options?.subtitle
      ? `<p class="subtitle">${escapeHtml(options.subtitle)}</p>`
      : "";

    const titleDir = hasArabic(title) ? ' dir="rtl"' : '';

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    ${pageSize}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Noto Naskh Arabic', Arial, sans-serif;
      color: #222;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 11px; color: #555; margin-bottom: 2px; }
    .export-date { font-size: 9px; color: #888; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th {
      background: #f0f0f0;
      padding: 5px 4px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #ddd;
      font-size: 9px;
    }
    td {
      padding: 4px;
      border-bottom: 1px solid #eee;
      word-break: break-word;
    }
    tr.alt-row { background: #fafafa; }
    @media print {
      body { padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <h1${titleDir}>${escapeHtml(title)}</h1>
  ${subtitleHtml}
  <p class="export-date">Exported: ${exportDate}</p>
  <table>
    <thead>
      <tr>${headerCellsHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return { success: false, error: "Pop-up blocked. Please allow pop-ups and try again." };
    }

    printWindow.document.write(fullHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    const sanitizedTitle = sanitizeFileName(title);
    const fileName = `${sanitizedTitle}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
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
