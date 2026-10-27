import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkbook, cellValue, downloadFileName, excelSheetName, usableReportName } from "../src/exportWorkbook.js";
import { DEFAULTS } from "../src/settings.js";

function fakeExcelJS() {
  class Worksheet {
    constructor(name) {
      this.name = name;
      this.rows = [];
    }

    addRow(values) {
      const row = {
        values,
        font: null,
        eachCell(callback) {
          values.forEach((value, index) => callback({ value }, index + 1));
        },
      };
      this.rows.push(row);
      return row;
    }

    eachRow(callback) {
      this.rows.forEach(callback);
    }

    getColumn() {
      return {};
    }
  }

  class Workbook {
    constructor() {
      this.creator = "";
      this.worksheets = [];
      this.xlsx = {
        writeBuffer: async () => this.worksheets,
      };
    }

    addWorksheet(name) {
      const sheet = new Worksheet(name);
      this.worksheets.push(sheet);
      return sheet;
    }
  }

  return { Workbook };
}

test("sheet names stay unique and Excel-safe", () => {
  const used = new Set();
  assert.equal(excelSheetName("30 days ", used), "30 days");
  assert.equal(excelSheetName("30 days: products?", used), "30 days products");
  assert.equal(excelSheetName("а".repeat(40), used).length, 31);
  assert.equal(excelSheetName("30 days", used), "30 days 2");
});

test("file name follows the dashboard page or a custom value", () => {
  assert.equal(downloadFileName("dashboard", "", "30 days"), "30 days.xlsx");
  assert.equal(downloadFileName("custom", "Лиды", "30 days"), "Лиды.xlsx");
  assert.equal(downloadFileName("custom", "  ", "30 days"), "30 days.xlsx");
  assert.equal(downloadFileName("custom", "отчёт.xlsx", "30 days"), "отчёт.xlsx");
  assert.equal(
    downloadFileName("report-page", "", "30 days", "leadgen-weekly-report"),
    "leadgen-weekly-report 30 days.xlsx",
  );
  assert.equal(downloadFileName("report-page", "", "30 days", ""), "30 days.xlsx");
  assert.equal(downloadFileName("report-page", "", "30 days", "Download Excel"), "30 days.xlsx");
  assert.equal(
    usableReportName("Download Excel", "df_leadgen-weekly-report"),
    "leadgen-weekly-report",
  );
  assert.equal(usableReportName("Скачать Excel", "Parameters", "federated.abc"), "");
  assert.equal(usableReportName("Скачать в excel", "Parameters", "federated.abc"), "");
});

test("default filename mode combines report and dashboard page", () => {
  assert.equal(DEFAULTS.fileNameMode, "report-page");
  assert.equal(
    downloadFileName(DEFAULTS.fileNameMode, "", "Партнёры", "leadgen-weekly-report"),
    "leadgen-weekly-report Партнёры.xlsx",
  );
});

test("cells keep numbers and dates", () => {
  const day = new Date("2026-10-21T00:00:00Z");
  assert.equal(cellValue({ value: 42, formattedValue: "42" }), 42);
  assert.equal(cellValue({ value: day, formattedValue: "21 окт." }), day);
  assert.equal(cellValue({ value: "%null%", formattedValue: "" }), null);
  assert.equal(cellValue({ value: "b2b", formattedValue: "B2B" }), "B2B");
});

test("workbook contains one worksheet per chart", async () => {
  const sheets = await buildWorkbook(fakeExcelJS(), [
    {
      name: "Динамика",
      columns: [{ fieldName: "date" }, { fieldName: "leads" }],
      rows: [[{ value: "21 окт.", formattedValue: "21 окт." }, { value: 54, formattedValue: "54" }]],
    },
    {
      name: "Продукты",
      columns: [{ fieldName: "product" }],
      rows: [[{ value: null, formattedValue: "" }]],
    },
  ]);
  assert.deepEqual(
    sheets.map((sheet) => sheet.name),
    ["Динамика", "Продукты"],
  );
  assert.equal(sheets[0].rows[1].values[1], 54);
  assert.equal(sheets[1].rows[1].values[0], null);
});
