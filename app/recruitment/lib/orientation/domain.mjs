// Pure report/workflow rules shared by the future API and preview components.
export const TIME_ZONE = "Asia/Bangkok";
export const PHOTO_TYPES = ["orientation", "site_visit", "handover"];
export function normalizedStatus(value) { return String(value || "").replace(/^'+|'+$/g, ""); }

export function bangkokDate(value = new Date()) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function thaiDate(value, long = false) {
  const day = bangkokDate(value);
  if (!day) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: TIME_ZONE, year: "numeric", month: long ? "long" : "2-digit",
    day: "2-digit", ...(long ? { weekday: "long" } : {}),
  }).format(new Date(`${day}T12:00:00+07:00`));
}

export function uniqueEmployees(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const id = row.application_id || row.employee_id || row.emp_id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// created_at is the actual document timestamp. Ignore blank URLs before sorting.
export function employeePhoto(application, documents = []) {
  const profile = application.profile_image_url?.trim();
  if (profile) return profile;
  return documents.filter((doc) => doc.application_id === application.id &&
    doc.document_type === "photo" && doc.file_url?.trim())
    .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) ||
      String(b.id || "").localeCompare(String(a.id || "")))[0]?.file_url.trim() || null;
}

export function filterEmployees(rows, filters = {}) {
  return uniqueEmployees(rows).filter((row) =>
    (!filters.branch_id || row.branch_id === filters.branch_id) &&
    (!filters.department_id || row.department_id === filters.department_id) &&
    (!filters.start_from || (row.start_work_date && row.start_work_date >= filters.start_from)) &&
    (!filters.start_to || (row.start_work_date && row.start_work_date <= filters.start_to)) &&
    (!filters.orientation_date || row.orientation_date === filters.orientation_date) &&
    (!filters.session_id || row.session_id === filters.session_id) &&
    (!filters.attendance_status || row.attendance_status === filters.attendance_status) &&
    (!filters.workflow_status || row.workflow_status === filters.workflow_status));
}

// Always pass the full filtered dataset, never the displayed table page.
export function reportRows(filteredRows, selectedEmployeeIds = []) {
  const ids = new Set(selectedEmployeeIds);
  return uniqueEmployees(filteredRows).filter((row) => !ids.size || ids.has(row.application_id || row.employee_id || row.emp_id));
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const value = key(row);
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(row);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, "th"));
}

function branchCounts(rows) {
  return groupBy(uniqueEmployees(rows), (row) => row.branch_code_snapshot || row.branch_code || "ไม่ระบุสังกัด");
}

export function startWorkText(rows, { recipient = "คุณม่อน", closing = "ค่ะ" } = {}) {
  const employees = uniqueEmployees(rows);
  if (!employees.length) return "";
  return `เรียน ${recipient}\nขออนุญาตแจ้งให้ทราบว่า พนักงานจะเริ่มปฏิบัติงาน\n` +
    branchCounts(employees).map(([branch, items]) => `${branch} = ${items.length} คน`).join("\n") +
    `\nทั้งหมด ${employees.length} คน${closing}`;
}

export function attendanceText(rows, { recipient = "คุณม่อน", closing = "ค่ะ" } = {}) {
  const attended = uniqueEmployees(rows.filter((row) => row.attendance_status === "attended"));
  return groupBy(attended, (row) => row.orientation_date || "").map(([day, employees]) =>
    `เรียน ${recipient}\nขออนุญาตรายงานจำนวนพนักงานเริ่มงานใหม่ พร้อมภาพบรรยากาศการปฐมนิเทศพนักงาน ดังรายละเอียดต่อไปนี้\n` +
    `วันที่ : ${thaiDate(day, true)}\nจำนวนพนักงาน : ${employees.length} ท่าน\nโดยแบ่งตามสังกัด ดังนี้\n` +
    branchCounts(employees).map(([branch, items]) => `🔹 ${branch} จำนวน ${items.length} ท่าน`).join("\n") +
    `\n${closing}`).join("\n\n");
}

export function staffPages(rows, pageSize = 10) {
  if (!Number.isInteger(pageSize) || pageSize < 5 || pageSize > 20 || pageSize % 5) {
    throw new Error("Staff pages must contain 5, 10, 15 or 20 employees");
  }
  return groupBy(uniqueEmployees(rows), (row) => JSON.stringify([
    row.branch_id || row.branch_code_snapshot || row.branch_code || "", row.start_work_date || "",
  ])).flatMap(([key, employees]) => {
    const [branch, date] = JSON.parse(key);
    return Array.from({ length: Math.ceil(employees.length / pageSize) }, (_, page) => ({
      branch, date, page: page + 1, rows: employees.slice(page * pageSize, (page + 1) * pageSize),
    }));
  });
}

// Resolve evidence by persisted IDs; a group photo can satisfy multiple people.
// The caller must first authorize every row and serialize mutations in the DB.
export function completionIssues(participant, session, handovers, photos, links) {
  const issues = [];
  const day = bangkokDate(session?.orientation_date);
  if (!day || participant.session_id !== session?.id) return ["รอบไม่ถูกต้อง"];
  if (normalizedStatus(participant.attendance_status) !== "attended") issues.push("ยังไม่ได้เข้าร่วมจริง");
  if (bangkokDate(participant.attended_at) !== day) issues.push("เวลาเข้าร่วมไม่ตรงวันรอบ");
  if (normalizedStatus(participant.site_visit_status) !== "visited" || bangkokDate(participant.site_visited_at) !== day) issues.push("ยังไม่มี Site Visit ในวันรอบ");
  const deliveries = handovers.filter((row) => row.participant_id === participant.id &&
    row.receiver_employee_id && row.delivered_by_employee_id && row.handover_location?.trim() &&
    bangkokDate(row.handover_at) === day);
  if (!deliveries.length) issues.push("ยังไม่มีการส่งมอบครบถ้วนในวันรอบ");
  for (const type of PHOTO_TYPES) {
    const valid = photos.some((photo) => photo.session_id === session.id && photo.photo_type === type &&
      photo.path_url?.trim() && links.some((link) => link.photo_id === photo.id &&
        link.participant_id === participant.id && (type !== "handover" || deliveries.some((row) => row.id === link.handover_id))));
    if (!valid) issues.push(`ไม่มีภาพ ${type}`);
  }
  return issues;
}
