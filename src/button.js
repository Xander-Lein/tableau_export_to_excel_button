import { buildWorkbook, downloadFileName, saveBlob, usableReportName } from "./exportWorkbook.js";
import { labelColor, readSettings } from "./settings.js";

const stage = document.querySelector("#stage");
const button = document.querySelector("#export");

const horizontal = { left: "flex-start", center: "center", right: "flex-end" };
const vertical = { top: "flex-start", center: "center", bottom: "flex-end" };

function paint() {
  const settings = readSettings(tableau.extensions.settings);
  stage.style.justifyContent = horizontal[settings.alignH];
  stage.style.alignItems = vertical[settings.alignV];
  button.textContent = settings.buttonLabel;
  button.style.backgroundColor = settings.buttonColor;
  button.style.color = labelColor(settings.buttonColor);
}

async function currentReport() {
  const stored = usableReportName(tableau.extensions.settings.get("workbookName"));
  if (stored) return stored;
  try {
    const sources = await tableau.extensions.workbook.getAllDataSourcesAsync();
    return usableReportName(...sources.map((source) => source.name));
  } catch {
    return "";
  }
}

function openConfigure() {
  const url = new URL("configure.html", window.location.href);
  return tableau.extensions.ui
    .displayDialogAsync(url.href, "", { height: 560, width: 460 })
    .then(paint)
    .catch(() => {});
}

async function readSheet(worksheet) {
  try {
    const table = await worksheet.getSummaryDataAsync({ ignoreSelection: true });
    return { name: worksheet.name, columns: table.columns, rows: table.data };
  } catch (error) {
    return {
      name: worksheet.name,
      columns: [],
      rows: [],
      error: error?.message || "Не удалось прочитать график",
    };
  }
}

async function exportPage() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const settings = readSettings(tableau.extensions.settings);
  const label = button.textContent;
  button.disabled = true;
  try {
    const sheets = [];
    for (const worksheet of dashboard.worksheets) sheets.push(await readSheet(worksheet));
    const buffer = await buildWorkbook(window.ExcelJS, sheets);
    const report = await currentReport();
    saveBlob(buffer, downloadFileName(settings.fileNameMode, settings.customFileName, dashboard.name, report));
  } catch (error) {
    button.textContent = error?.message || "Не удалось создать файл";
    return;
  } finally {
    button.disabled = false;
  }
  button.textContent = label;
}

tableau.extensions
  .initializeAsync({ configure: openConfigure })
  .then(() => {
    paint();
    button.addEventListener("click", () => {
      exportPage();
    });
  })
  .catch(() => {
    button.textContent = "Откройте внутри Tableau";
  });
