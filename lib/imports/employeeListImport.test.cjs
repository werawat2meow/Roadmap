const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const XLSX = require("xlsx");
const { NextResponse } = require("next/server");

// Load project ES modules with explicit dependencies, without connecting to a database.
function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const loaded = { exports: {} };
  cache.set(absolute, loaded.exports);
  const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const dependency = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/")) return load(`${name.slice(2)}.js`, mocks, cache);
    if (name.startsWith(".")) return load(path.resolve(path.dirname(absolute), `${name}.js`), mocks, cache);
    return require(name);
  };
  new Function("require", "module", "exports", source)(dependency, loaded, loaded.exports);
  cache.set(absolute, loaded.exports);
  return loaded.exports;
}

const workbook = load("lib/imports/employeeListWorkbook.js");
const basic = { employee_code: "000123", first_name_th: "สมชาย", last_name_th: "ทดสอบ", start_work_date: "2026-11-11" };
function file(rows, update) {
  const headers = workbook.EMPLOYEE_IMPORT_COLUMNS.map(([, label]) => label);
  const matrix = [headers, ...rows.map((row) => workbook.EMPLOYEE_IMPORT_COLUMNS.map(([key]) => row[key] ?? ""))];
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  update?.(sheet);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, workbook.EMPLOYEE_SHEET);
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" });
}

test("downloaded template round trips and contains every new UI field and reference sheets", async () => {
  const buffer = await workbook.buildEmployeeListTemplate({});
  const book = XLSX.read(buffer);
  assert.deepEqual(XLSX.utils.sheet_to_json(book.Sheets[workbook.EMPLOYEE_SHEET], { header: 1 })[0], workbook.EMPLOYEE_IMPORT_COLUMNS.map(([, label]) => label));
  assert.ok(book.SheetNames.includes("REF_position_levels_map"));
  assert.deepEqual(workbook.parseEmployeeListWorkbook(buffer), []);
});

test("names can be imported with all organization fields blank; identifiers preserve zeros", () => {
  const [row] = workbook.parseEmployeeListWorkbook(file([{ ...basic, legacy_codes: "001;002", citizen_id: "0123456789012", base_salary: "15000.50" }]));
  assert.deepEqual(row.errors, []);
  assert.equal(row.body.employee_code, "000123");
  assert.equal(row.body.citizen_id, "0123456789012");
  assert.deepEqual(row.body.legacy_codes, ["001", "002"]);
  assert.equal(row.body.branch_id, "");
});

test("Excel dates and formatted numeric codes are converted as displayed in preview", () => {
  const [row] = workbook.parseEmployeeListWorkbook(file([{ ...basic, employee_code: 123, start_work_date: 46337 }], (sheet) => { sheet.A2.z = "000000"; }));
  assert.equal(row.body.employee_code, "000123");
  assert.equal(row.raw.employee_code, "000123");
  assert.match(row.body.start_work_date, /^2026-/);
  assert.match(row.raw.start_work_date, /^\d{2}\/\d{2}\/2026$/);
});

test("slash dates always mean day/month/year, with ISO kept for existing files", () => {
  const [row] = workbook.parseEmployeeListWorkbook(file([{ ...basic, start_work_date: "4/8/2026", birth_date: "09/12/1990" }]));
  assert.deepEqual(row.errors, []);
  assert.equal(row.body.start_work_date, "2026-08-04");
  assert.equal(row.raw.start_work_date, "04/08/2026");
  assert.equal(row.body.birth_date, "1990-12-09");
  assert.equal(row.raw.birth_date, "09/12/1990");
  const [oldFile] = workbook.parseEmployeeListWorkbook(file([basic]));
  assert.equal(oldFile.body.start_work_date, "2026-11-11");
  assert.equal(oldFile.raw.start_work_date, "11/11/2026");
});

test("day-first dates validate leap years and reject month-first or impossible dates", () => {
  for (const date of ["31/04/2026", "29/02/2025", "08/31/2026"]) {
    const [row] = workbook.parseEmployeeListWorkbook(file([{ ...basic, start_work_date: date }]));
    assert.ok(row.errors.some((error) => error.includes("วันที่เริ่มงาน")), date);
  }
  const [leapDay] = workbook.parseEmployeeListWorkbook(file([{ ...basic, start_work_date: "29/02/2024" }]));
  assert.deepEqual(leapDay.errors, []);
  assert.equal(leapDay.body.start_work_date, "2024-02-29");
});

test("rejects impossible dates, formulas, invalid flags and row overflow", () => {
  const [row] = workbook.parseEmployeeListWorkbook(file([{ ...basic, birth_date: "2026-02-30", create_user_account: "maybe" }], (sheet) => { sheet.A2.f = '"000123"'; }));
  assert.ok(row.errors.some((error) => error.includes("วันเกิด")));
  assert.ok(row.errors.some((error) => error.includes("สูตร")));
  assert.ok(row.errors.some((error) => error.includes("ใช่")));
  assert.throws(() => workbook.parseEmployeeListWorkbook(file(Array.from({ length: 201 }, () => basic))), /200/);
});

test("rejects missing headers and wrong worksheet", () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["wrong"]]), workbook.EMPLOYEE_SHEET);
  assert.throws(() => workbook.parseEmployeeListWorkbook(XLSX.write(book, { type: "buffer", bookType: "xlsx" })), /หัวคอลัมน์/);
  book.SheetNames[0] = "wrong";
  assert.throws(() => workbook.parseEmployeeListWorkbook(XLSX.write(book, { type: "buffer", bookType: "xlsx" })), /ไม่พบชีต/);
});

test("resolves scoped references and marks current/legacy code collisions on every affected row", () => {
  const rows = workbook.parseEmployeeListWorkbook(file([
    { ...basic, branch_id: "B1", department_id: "แผนกทดสอบ", legacy_codes: "OLD" },
    { ...basic, employee_code: "OLD" },
  ]));
  workbook.resolveEmployeeListRows(rows, {
    branches: [{ id: "branch", branch_code: "B1" }],
    departments: [{ id: "dep", department_name: "แผนกทดสอบ" }],
    branch_departments: [{ branch_id: "branch", department_id: "dep" }],
  });
  assert.equal(rows[0].body.branch_id, "branch");
  assert.equal(rows[0].body.department_id, "dep");
  assert.ok(rows.every((row) => row.errors.some((error) => error.includes("OLD"))));
});

function serviceHarness({ scope = true, data = {}, failTable } = {}) {
  const writes = [];
  const db = { from(table) {
    let operation = "read";
    let payload;
    let excludesCurrentEmployee = false;
    const query = new Proxy({}, { get(_target, key) {
      if (key === "then") return (resolve) => resolve(operation === "read"
        ? { data: table === "employees" && excludesCurrentEmployee ? [] : data[table] ?? null, error: null }
        : { data: table === "employees" ? { id: "new-employee", employee_code: payload.employee_code } : null,
          error: failTable === table ? { code: "test-error" } : null });
      return (...args) => {
        if (key === "neq" && table === "employees") excludesCurrentEmployee = true;
        if (["insert", "upsert", "update", "delete"].includes(key)) {
          operation = key;
          payload = args[0];
          writes.push({ table, operation, payload });
        }
        return query;
      };
    } });
    return query;
  } };
  const service = load("lib/employee/createSimpleEmployee.js", {
    "@/lib/supabaseServer": { supabaseAdmin: db },
    "@/lib/employee/employeeCodeGenerator": { reserveEmployeeCode: () => { throw new Error("must not reserve a code during preview"); } },
    "next/server": { NextResponse },
  });
  return { ...service, db, writes, guard: { ok: true, canAccessEmployee: () => scope } };
}

test("preview is read only; confirm saves partial organization and salary without placeholder data", async () => {
  const harness = serviceHarness();
  const body = { ...basic, base_salary: "15000", legacy_codes: [] };
  assert.equal((await harness.createSimpleEmployee(body, harness.guard, { allowIncompleteOrganization: true, dryRun: true })).status, 200);
  assert.equal(harness.writes.length, 0);
  const response = await harness.createSimpleEmployee(body, harness.guard, { allowIncompleteOrganization: true });
  assert.equal(response.status, 201);
  const employee = harness.writes.find((write) => write.table === "employees").payload;
  assert.equal(employee.branch_id, null);
  assert.equal(employee.company_id, null);
  assert.equal(employee.position_id, null);
  const salary = harness.writes.find((write) => write.table === "employee_compensations").payload;
  assert.equal(salary.base_salary, "15000");
  assert.equal(salary.position_level_id, null);
});

test("manual create still requires organization; scope violations and missing legacy company cannot write", async () => {
  const harness = serviceHarness();
  assert.equal((await harness.createSimpleEmployee(basic, harness.guard)).status, 400);
  assert.equal((await harness.createSimpleEmployee({ ...basic, legacy_codes: ["old"] }, harness.guard, { allowIncompleteOrganization: true })).status, 400);
  const denied = serviceHarness({ scope: false });
  assert.equal((await denied.createSimpleEmployee(basic, denied.guard, { allowIncompleteOrganization: true })).status, 403);
  assert.equal(harness.writes.length + denied.writes.length, 0);
});

test("manual create allows a Level P without a position-level mapping", async () => {
  const harness = serviceHarness({ data: {
    branches: { id: "branch", company_id: "company", group_id: "group", status: "active" },
    departments: { id: "dep", status: "active" },
    positions: { id: "position", status: "active", position_family_id: "family", job_id: "job" },
    position_levels: { id: "level", level_code: "P7", status: "active" },
    branch_departments: { id: "link" },
  } });
  const response = await harness.createSimpleEmployee({ ...basic, branch_id: "branch", department_id: "dep", position_id: "position", position_level_id: "level" }, harness.guard);
  assert.equal(response.status, 201);
  const row = harness.writes.find((write) => write.table === "employees").payload;
  assert.equal(row.company_id, "company");
  assert.equal(row.branch_id, "branch");
  assert.equal(row.position_id, "position");
  assert.equal(row.position_level_id, "level");
});

test("import preview and save accept a Level P independently of position", async () => {
  const harness = serviceHarness({ data: {
    positions: { id: "driver", status: "active" },
    position_levels: { id: "p7", level_code: "P7", status: "active" },
  } });
  const body = { ...basic, position_id: "driver", position_level_id: "p7" };
  assert.equal((await harness.createSimpleEmployee(body, harness.guard, { allowIncompleteOrganization: true, dryRun: true })).status, 200);
  assert.equal(harness.writes.length, 0);
  assert.equal((await harness.createSimpleEmployee(body, harness.guard, { allowIncompleteOrganization: true })).status, 201);
  assert.equal(harness.writes.find((write) => write.table === "employees").payload.position_level_id, "p7");
});

test("edit saves a Level P not mapped to the selected position", async () => {
  const harness = serviceHarness({ data: {
    employees: { id: "existing", company_id: "company" },
    branches: { id: "branch", company_id: "company", group_id: "group", status: "active" },
    departments: { id: "dep", status: "active" },
    positions: { id: "driver", status: "active" },
    position_levels: { id: "p7", level_code: "P7", status: "active" },
    branch_departments: { id: "link" },
  } });
  const route = load("app/api/admin/employees/simple/[id]/route.js", {
    "@/lib/supabaseServer": { supabaseAdmin: harness.db },
    "@/lib/auth/requireScopedAccess": { requireScopedAccess: async () => harness.guard },
  });
  const response = await route.PATCH(new Request("http://localhost/api/admin/employees/simple/existing", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...basic, branch_id: "branch", department_id: "dep", position_id: "driver", position_level_id: "p7" }),
  }), { params: Promise.resolve({ id: "existing" }) });
  assert.equal(response.status, 200);
  assert.equal(harness.writes.find((write) => write.table === "employees").payload.position_level_id, "p7");
});

test("preview detects existing employee codes and does not allocate login codes", async () => {
  const duplicate = serviceHarness({ data: { employees: { id: "existing" } } });
  assert.equal((await duplicate.createSimpleEmployee(basic, duplicate.guard, { allowIncompleteOrganization: true, dryRun: true })).status, 409);
  const account = serviceHarness({ data: { companies: { id: "co", status: "active" }, employee_code_settings: [{ id: "setting" }], roles: { id: "role" } } });
  const response = await account.createSimpleEmployee({ ...basic, employee_code: "", create_user_account: true, import_company_id: "co" }, account.guard, { allowIncompleteOrganization: true, dryRun: true });
  assert.equal(response.status, 200);
  assert.equal(account.writes.length, 0);
});

test("confirm revalidates before writing, blocks invalid files, and reports per-row save results", async () => {
  let valid = false;
  let writes = 0;
  const rows = [{ rowNumber: 2, raw: {}, body: basic, errors: [] }];
  const route = load("app/api/admin/employees/import/route.js", {
    "@/lib/auth/requireScopedAccess": { requireScopedAccess: async () => ({ ok: true }) },
    "@/lib/imports/employeeListImport": {
      previewEmployeeListImport: async () => rows.map((row) => ({ ...row, errors: valid ? [] : ["invalid"] })),
      publicEmployeeImportRow: (row) => ({ rowNumber: row.rowNumber, errors: row.errors }),
    },
    "@/lib/employee/createSimpleEmployee": { createSimpleEmployee: async () => { writes++; return NextResponse.json({ success: true, data: { employee_code: "000123" } }); } },
  });
  const request = (mode) => {
    const form = new FormData();
    form.append("mode", mode);
    form.append("file", new Blob(["test"]), "test.xlsx");
    return new Request("http://localhost/api/admin/employees/import", { method: "POST", body: form });
  };
  await route.POST(request("preview"));
  assert.equal(writes, 0);
  assert.equal((await route.POST(request("confirm"))).status, 400);
  assert.equal(writes, 0);
  valid = true;
  const result = await (await route.POST(request("confirm"))).json();
  assert.equal(result.importedRows, 1);
  assert.equal(writes, 1);
});
