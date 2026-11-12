import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export const EMPLOYEE_SHEET = "ข้อมูลพนักงาน";
export const MAX_EMPLOYEE_IMPORT_ROWS = 200;
import { EMPLOYEE_IMPORT_COLUMNS } from "./employeeListColumns";
export { EMPLOYEE_IMPORT_COLUMNS } from "./employeeListColumns";

export const EMPLOYEE_IMPORT_MASTERS = {
  titles: ["title_id", "title_code", "title_name_th", "title_name_en"],
  genders: ["gender_id", "gender_code", "gender_name_th", "gender_name_en"],
  branches: ["branch_id", "branch_code", "branch_name"],
  departments: ["department_id", "department_code", "department_name"],
  divisions: ["division_id", "division_code", "division_name"],
  units: ["unit_id", "unit_code", "unit_name"],
  positions: ["position_id", "position_code", "position_name"],
  position_levels: ["position_level_id", "level_code", "level_name"],
};

const text = (value) => String(value ?? "").trim();

function dateText(value, date1904 = false) {
  if (!text(value)) return "";
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value, { date1904 });
    if (!date) throw new Error("วันที่ใน Excel ไม่ถูกต้อง");
    value = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const input = text(value);
  const dayFirst = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  // Keep ISO support for files downloaded before the day/month/year template.
  const result = dayFirst
    ? `${dayFirst[3]}-${dayFirst[2].padStart(2, "0")}-${dayFirst[1].padStart(2, "0")}`
    : input;
  const date = new Date(`${result}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== result) {
    throw new Error("วันที่ต้องเป็นวัน/เดือน/ปี ค.ศ. เช่น 04/08/2026 (4 สิงหาคม 2026) และเป็นวันที่ที่มีอยู่จริง");
  }
  return result;
}

export function parseEmployeeListWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, sheetRows: MAX_EMPLOYEE_IMPORT_ROWS + 2 });
  const sheet = workbook.Sheets[EMPLOYEE_SHEET];
  if (!sheet) throw new Error(`ไม่พบชีต ${EMPLOYEE_SHEET} กรุณาใช้ไฟล์ Download template`);
  const range = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"] || "A1");
  if (range.e.r > MAX_EMPLOYEE_IMPORT_ROWS) throw new Error(`นำเข้าได้ไม่เกิน ${MAX_EMPLOYEE_IMPORT_ROWS} แถวต่อครั้ง`);
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true, blankrows: true });
  const headers = (matrix[0] || []).map(text);
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw new Error("หัวคอลัมน์ซ้ำกัน");
  const required = ["employee_code", "first_name_th", "last_name_th", "start_work_date"];
  for (const key of required) {
    const label = EMPLOYEE_IMPORT_COLUMNS.find(([field]) => field === key)[1];
    if (!headers.includes(label) && !headers.includes(key)) throw new Error(`ไม่พบหัวคอลัมน์ ${label}`);
  }
  const indexes = EMPLOYEE_IMPORT_COLUMNS.map(([key, label]) => [key, headers.findIndex((header) => header === label || header === key)]);
  return matrix.slice(1).flatMap((cells, index) => {
    if (!cells.some((cell) => text(cell))) return [];
    const raw = Object.fromEntries(indexes.map(([key, column]) => [key, column < 0 ? "" : cells[column]]));
    const errors = [];
    for (const [key, column] of indexes) {
      if (column >= 0 && sheet[XLSX.utils.encode_cell({ r: index + 1, c: column })]?.f) {
        errors.push(`${EMPLOYEE_IMPORT_COLUMNS.find(([field]) => field === key)[1]}: ไม่รองรับสูตร Excel`);
      }
    }
    const body = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, text(value)]));
    for (const key of ["birth_date", "start_work_date"]) {
      try { body[key] = dateText(raw[key], Boolean(workbook.Workbook?.WBProps?.date1904)); } catch (error) { errors.push(`${key === "birth_date" ? "วันเกิด" : "วันที่เริ่มงาน"}: ${error.message}`); }
    }
    const flag = text(raw.create_user_account).toLowerCase();
    if (!["", "false", "0", "no", "ไม่", "true", "1", "yes", "ใช่"].includes(flag)) errors.push("สร้างรหัสเข้าใช้งาน: ระบุ ใช่ หรือ ไม่");
    body.create_user_account = ["true", "1", "yes", "ใช่"].includes(flag);
    if (body.create_user_account && body.employee_code) errors.push("เมื่อเลือกสร้างรหัสเข้าใช้งาน ให้เว้นรหัสพนักงานปัจจุบัน");
    body.legacy_codes = text(raw.legacy_codes).split(/[;,\n|]+/).map(text).filter(Boolean);
    // Preserve displayed leading zeros for numeric cells formatted as employee/identity codes.
    for (const key of ["employee_code", "citizen_id", "passport_no", "legacy_codes"]) {
      const column = indexes.find(([field]) => field === key)[1];
      const cell = column < 0 ? null : sheet[XLSX.utils.encode_cell({ r: index + 1, c: column })];
      if (cell?.t === "n") {
        const displayed = text(cell.w ?? cell.v);
        if (/e[+-]/i.test(displayed) || !Number.isSafeInteger(cell.v)) errors.push("กรุณาตั้งคอลัมน์รหัสและเลขประจำตัวเป็นข้อความ เพื่อป้องกันตัวเลขสูญหาย");
        if (key === "legacy_codes") body[key] = [displayed]; else body[key] = displayed;
      }
    }
    if (body.birth_date && body.start_work_date && body.birth_date >= body.start_work_date) errors.push("วันเกิดต้องอยู่ก่อนวันที่เริ่มงาน");
    if (body.employee_photo_url && !/^https?:\/\//i.test(body.employee_photo_url)) errors.push("รูปพนักงานต้องเป็น URL แบบ http หรือ https");
    if (body.new_position_name && body.position_id) errors.push("ระบุตำแหน่งเดิมหรือชื่อตำแหน่งใหม่เพียงอย่างเดียว");
    const display = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, text(value)]));
    for (const key of ["employee_code", "citizen_id", "passport_no", "birth_date", "start_work_date"]) display[key] = body[key];
    for (const key of ["birth_date", "start_work_date"]) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(body[key])) display[key] = body[key].split("-").reverse().join("/");
    }
    display.legacy_codes = body.legacy_codes.join("; ");
    return [{ rowNumber: index + 2, body, raw: display, errors }];
  });
}

export function resolveEmployeeListRows(rows, masters, companyId = "") {
  const codeOwners = new Map();
  for (const row of rows) {
    row.body.import_company_id = companyId;
    for (const [table, [field, ...keys]] of Object.entries(EMPLOYEE_IMPORT_MASTERS)) {
      const value = row.body[field];
      if (!value) continue;
      let candidates = (masters[table] || []).filter((item) => [item.id, ...keys.map((key) => item[key])].some((candidate) => text(candidate).toLowerCase() === value.toLowerCase()));
      if (table === "titles") candidates = (masters.titles || []).filter((item) => candidates.includes(item) || [item.title_name_th, item.title_name_en].filter(Boolean).join(" / ") === value);
      if (table === "departments" && row.body.branch_id) candidates = candidates.filter((item) => (masters.branch_departments || []).some((link) => link.branch_id === row.body.branch_id && link.department_id === item.id));
      if (table === "divisions" && row.body.department_id) candidates = candidates.filter((item) => item.department_id === row.body.department_id);
      if (table === "units" && row.body.division_id) candidates = candidates.filter((item) => item.division_id === row.body.division_id);
      if (candidates.length !== 1) row.errors.push(`${EMPLOYEE_IMPORT_COLUMNS.find(([key]) => key === field)[1]}: ${candidates.length ? "ชื่อซ้ำ กรุณาใช้รหัสจากชีตอ้างอิง" : "ไม่พบข้อมูลที่เปิดใช้งาน"}`);
      else row.body[field] = candidates[0].id;
    }
    if (row.body.new_position_name && !row.body.position_id) row.body.position_id = "__new__";
    for (const code of [row.body.employee_code, ...row.body.legacy_codes].filter(Boolean)) {
      const owners = codeOwners.get(code) || [];
      owners.push(row);
      codeOwners.set(code, owners);
    }
  }
  for (const [code, owners] of codeOwners) {
    if (owners.length > 1) for (const row of new Set(owners)) row.errors.push(`รหัส ${code} ซ้ำในไฟล์ (แถว ${[...new Set(owners.map((owner) => owner.rowNumber))].join(", ")})`);
  }
  return rows;
}

export async function buildEmployeeListTemplate(masters) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(EMPLOYEE_SHEET);
  sheet.columns = EMPLOYEE_IMPORT_COLUMNS.map(([key, header]) => ({ key, header, width: Math.max(20, header.length + 4), style: { numFmt: "@" } }));
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EMPLOYEE_IMPORT_COLUMNS.length } };
  sheet.getRow(1).height = 32;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
  });
  for (const [index, [key]] of EMPLOYEE_IMPORT_COLUMNS.entries()) {
    sheet.getCell(1, index + 1).note = ["first_name_th", "last_name_th", "start_work_date"].includes(key)
      ? "จำเป็นต้องกรอก" : "employee_code" === key ? "จำเป็นเมื่อไม่ได้เลือกสร้างรหัสเข้าใช้งาน" : "ไม่บังคับ / ตามเงื่อนไขในชีตวิธีกรอก";
    if (["birth_date", "start_work_date"].includes(key)) {
      sheet.getCell(1, index + 1).note = `${key === "start_work_date" ? "จำเป็นต้องกรอก" : "ไม่บังคับ"} — วัน/เดือน/ปี ค.ศ. (DD/MM/YYYY) เช่น 04/08/2026 = 4 สิงหาคม 2026 กรอกเป็นข้อความเพื่อไม่ให้ Excel สลับวันกับเดือน`;
    }
  }
  const help = workbook.addWorksheet("วิธีกรอก");
  help.columns = [{ header: "หัวข้อ", width: 34 }, { header: "คำแนะนำ", width: 115 }];
  help.addRows([
    ["การใช้งาน", "กรอกในชีตข้อมูลพนักงาน 1 คนต่อแถว ไม่เกิน 200 คน แล้วอัปโหลดเพื่อตรวจสอบตัวอย่างก่อนยืนยัน"],
    ["จำเป็น", "ชื่อภาษาไทย นามสกุลภาษาไทย วันที่เริ่มงาน และรหัสพนักงานปัจจุบัน (ยกเว้นเลือกสร้างรหัสเข้าใช้งาน)"],
    ["ข้อมูลองค์กร", "เว้นสังกัด แผนก ฝ่าย หน่วย ตำแหน่ง และ Level P ได้ แล้วกดแก้ไขในระบบเพื่อเติมภายหลัง ตามขอบเขตสิทธิ์ของผู้ใช้"],
    ["ตัวเลือกจากระบบ", "ใช้รหัสหรือชื่อจากชีต REF_* หากชื่อซ้ำให้ใช้รหัส แผนกต้องตรงสังกัด ฝ่ายตรงแผนก หน่วยตรงฝ่าย ส่วน Level P เลือกได้อิสระจากตำแหน่ง"],
    ["วันที่", "กรอกวัน/เดือน/ปี ค.ศ. (DD/MM/YYYY) เช่น 04/08/2026 = 4 สิงหาคม 2026 ทั้งวันเกิดและวันที่เริ่มงาน ช่องวันที่ตั้งเป็นข้อความไว้เพื่อป้องกัน Excel สลับวันกับเดือน"],
    ["รหัส / เลขบัตร", "เก็บเป็นข้อความเพื่อรักษาเลขศูนย์ด้านหน้า ไม่ใช้สูตร Excel"],
    ["รหัสพนักงานเก่า", "คั่นหลายรหัสด้วย ; เช่น 00123;00456 ห้ามซ้ำกับรหัสปัจจุบันหรือพนักงานอื่น"],
    ["สร้างรหัสเข้าใช้งาน", "ระบุ ใช่ หรือ ไม่ (ว่าง = ไม่) เมื่อเลือก ใช่ ให้เว้นรหัสปัจจุบัน ระบบสร้างรหัสและบัญชีผู้ใช้ตามหน้าเพิ่มพนักงาน"],
    ["บริษัท", "ถ้ามีรหัสเก่าหรือเลือกสร้างบัญชี แต่ไม่ระบุสังกัด ต้องเลือกบริษัทในหน้าต่าง Import"],
    ["ตำแหน่งใหม่", "กรอกชื่อตำแหน่งใหม่แทนคอลัมน์ตำแหน่ง และระบุ Level P เพื่อสร้างตำแหน่งพร้อมข้อมูลพนักงาน"],
    ["เงินเดือน", "ไม่บังคับ ตัวเลขตั้งแต่ 0 ทศนิยมไม่เกิน 2 ตำแหน่ง ไม่ใส่เครื่องหมายคั่นหลักพัน"],
    ["รูปพนักงาน", "ไม่บังคับ ใส่ URL รูปภาพที่เข้าถึงได้ หรือเพิ่มรูปในระบบภายหลัง"],
    ["ข้อมูลซ้ำ", "เพิ่มพนักงานใหม่เท่านั้น ไม่อัปเดตทับพนักงานเดิม"],
  ]);
  for (const [table, [, ...keys]] of Object.entries(EMPLOYEE_IMPORT_MASTERS)) {
    const reference = workbook.addWorksheet(`REF_${table}`);
    const relationKeys = table === "branches" ? ["company_id"] : table === "divisions" ? ["department_id"] : table === "units" ? ["division_id"] : [];
    reference.columns = ["id", ...keys, ...relationKeys].map((key) => ({ header: key, key, width: 34, style: { numFmt: "@" } }));
    reference.addRows(masters[table] || []);
  }
  for (const table of ["branch_departments", "position_level_mappings"]) {
    const reference = workbook.addWorksheet(table === "position_level_mappings" ? "REF_position_levels_map" : "REF_branch_departments");
    const keys = table === "branch_departments" ? ["branch_id", "department_id"] : ["position_id", "position_level_id"];
    reference.columns = keys.map((key) => ({ header: key, key, width: 38 }));
    reference.addRows(masters[table] || []);
  }
  return workbook.xlsx.writeBuffer();
}
