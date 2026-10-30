const MAX_PRESENTATION_BATCH_SIZE = 20;

export function normalizePresentationBatch(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.filter(Boolean).slice(0, MAX_PRESENTATION_BATCH_SIZE);
}

export function getPresentationFilename(prefix, employee, index) {
  const safeEmployeeCode = String(employee?.emp_code || "employee")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-");
  const suffix = Number.isInteger(index)
    ? `-${String(index + 1).padStart(2, "0")}`
    : "";
  return `${prefix}-${safeEmployeeCode}${suffix}.png`;
}

export function waitForPresentationPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}
