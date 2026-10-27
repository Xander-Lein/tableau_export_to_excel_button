const INVALID_SHEET = /[:\\/?*[\]]/g;
const INVALID_FILE = /[<>:"/\\|?*\u0000-\u001F]/g;

export function excelSheetName(raw, used) {
  const cleaned = String(raw || "Sheet")
    .replace(INVALID_SHEET, " ")
    .replace(/\s+/g, " ")
    .trim() || "Sheet";
  const base = cleaned.slice(0, 31);
  let candidate = base;
  let index = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${index}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

const EXTENSION_TITLES = new Set(["download excel", "скачать excel"]);

export function usableReportName(...candidates) {
  for (const candidate of candidates) {
    const name = String(candidate || "").trim().replace(/^df_/, "");
    if (!name || name === "Parameters" || name.startsWith("federated.")) continue;
    if (EXTENSION_TITLES.has(name.toLowerCase())) continue;
    return name;
  }
  return "";
}

export function downloadFileName(mode, customName, pageName, reportName = "") {
  const custom = String(customName || "").trim();
  const page = String(pageName || "").trim();
  let source = page;
  if (mode === "custom" && custom) source = custom;
  if (mode === "report-page") source = [usableReportName(reportName), page].filter(Boolean).join(" ");
  let safe = String(source || "dashboard")
    .replace(INVALID_FILE, " ")
    .replace(/\s+/g, " ")
    .trim() || "dashboard";
  if (!safe.toLowerCase().endsWith(".xlsx")) safe = `${safe}.xlsx`;
  return safe;
}

export function cellValue(dataValue) {
  if (!dataValue) return null;
  const value = dataValue.value;
  if (value == null || value === "%null%") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (dataValue.formattedValue != null && dataValue.formattedValue !== "") {
    return dataValue.formattedValue;
  }
  return String(value);
}

export async function buildWorkbook(ExcelJS, sheets) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Excel Export";
  const used = new Set();
  const source = sheets.length ? sheets : [{ name: "Export", columns: [], rows: [], error: "На странице нет графиков" }];

  for (const sheet of source) {
    const worksheet = workbook.addWorksheet(excelSheetName(sheet.name, used));
    const headers = (sheet.columns || []).map((column) => column.fieldName || "");
    if (headers.length) {
      const header = worksheet.addRow(headers);
      header.font = { bold: true };
    }
    for (const row of sheet.rows || []) {
      worksheet.addRow(row.map(cellValue));
    }
    if (sheet.error) worksheet.addRow([sheet.error]);
    worksheet.eachRow((row) => {
      row.eachCell((cell, columnIndex) => {
        const column = worksheet.getColumn(columnIndex);
        const length = Math.min(String(cell.value ?? "").length + 2, 42);
        column.width = Math.max(column.width || 12, length);
      });
    });
  }

  return workbook.xlsx.writeBuffer();
}

export function saveBlob(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
