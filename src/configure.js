import { DEFAULTS, isHexColor, readSettings, writeSettings } from "./settings.js";

const form = document.querySelector("#config");
const error = document.querySelector("#formError");
const customName = document.querySelector("#customFileName");

function selectedMode() {
  return form.fileNameMode.value;
}

function toggleNameFields() {
  customName.disabled = selectedMode() !== "custom";
}

function fill(values) {
  form.buttonLabel.value = values.buttonLabel;
  form.alignH.value = values.alignH;
  form.alignV.value = values.alignV;
  form.buttonColor.value = values.buttonColor;
  form.fileNameMode.value = values.fileNameMode;
  customName.value = values.customFileName;
  toggleNameFields();
}

form.addEventListener("change", toggleNameFields);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const color = form.buttonColor.value.trim();
  if (!isHexColor(color)) {
    error.textContent = "Цвет укажите кодом из шести знаков, например #107c41";
    return;
  }
  const values = {
    buttonLabel: form.buttonLabel.value.trim() || DEFAULTS.buttonLabel,
    alignH: form.alignH.value,
    alignV: form.alignV.value,
    buttonColor: color,
    fileNameMode: selectedMode(),
    customFileName: customName.value.trim(),
  };
  writeSettings(tableau.extensions.settings, values);
  tableau.extensions.settings.saveAsync().then(() => {
    tableau.extensions.ui.closeDialog("");
  });
});

document.querySelector("#cancel").addEventListener("click", () => {
  tableau.extensions.ui.closeDialog("");
});

tableau.extensions.initializeDialogAsync().then(() => {
  fill(readSettings(tableau.extensions.settings));
});
