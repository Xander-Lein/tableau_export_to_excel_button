export const DEFAULTS = {
  buttonLabel: "Скачать в excel",
  alignH: "right",
  alignV: "bottom",
  buttonColor: "#107c41",
  fileNameMode: "report-page",
  customFileName: "",
};

const KEYS = Object.keys(DEFAULTS);

export function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
}

export function readSettings(store) {
  const values = { ...DEFAULTS };
  for (const key of KEYS) {
    const stored = store.get(key);
    if (stored != null && stored !== "") values[key] = stored;
  }
  if (["Скачать Excel", "Download Excel"].includes(String(values.buttonLabel).trim())) {
    values.buttonLabel = DEFAULTS.buttonLabel;
  }
  if (!["left", "center", "right"].includes(values.alignH)) values.alignH = DEFAULTS.alignH;
  if (!["top", "center", "bottom"].includes(values.alignV)) values.alignV = DEFAULTS.alignV;
  if (!isHexColor(values.buttonColor)) values.buttonColor = DEFAULTS.buttonColor;
  if (!["dashboard", "custom", "report-page"].includes(values.fileNameMode)) {
    values.fileNameMode = DEFAULTS.fileNameMode;
  }
  return values;
}

export function writeSettings(store, values) {
  for (const key of KEYS) store.set(key, String(values[key] ?? ""));
}

export function labelColor(hex) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62 ? "#1b1b1b" : "#ffffff";
}
