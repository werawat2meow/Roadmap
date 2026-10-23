const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Run the real calculation and route code without connecting to a database.
function load(relative, dependencies) {
  const filename = path.join(__dirname, "..", relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    console,
    URL,
  }, { filename });
  return exports;
}

function database(tables) {
  return {
    from(table) {
      let rows = [...(tables[table] || [])];
      const comparable = (column, value) =>
        ["startDate", "endDate"].includes(column) ? Date.parse(value) : value;
      const query = {
        select() { return query; },
        order() { return query; },
        eq(column, value) { rows = rows.filter((row) => row[column] === value); return query; },
        in(column, values) { rows = rows.filter((row) => values.includes(row[column])); return query; },
        gte(column, value) { rows = rows.filter((row) => comparable(column, row[column]) >= comparable(column, value)); return query; },
        lt(column, value) { rows = rows.filter((row) => comparable(column, row[column]) < comparable(column, value)); return query; },
        lte(column, value) { rows = rows.filter((row) => comparable(column, row[column]) <= comparable(column, value)); return query; },
        async range(from, to) { return { data: rows.slice(from, to + 1), error: null }; },
      };
      return query;
    },
  };
}

const reader = load("lib/leave-schedule-query.ts", {});
const date = "2026-10-22";
const schedule = (overrides = {}) => ({
  id: "schedule", employee_id: "e", work_date: date, day_type: "WORK", state: "PUBLISHED",
  leave_work_schedule_intervals: [{ sequence: 1, starts_at: `${date}T08:00:00+07:00`, ends_at: `${date}T17:00:00+07:00` }],
  ...overrides,
});
const scan = (overrides = {}) => ({
  id: "scan", employee_id: "e", work_date: date, check_in: "08:00:00", check_out: "17:00:00", ...overrides,
});
const leave = (overrides = {}) => ({
  id: "leave", employeeId: "e", kind: "SICK", status: "APPROVED", session: "FULL",
  startDate: `${date}T00:00:00+07:00`, endDate: `${date}T00:00:00+07:00`, requestedDays: 1, ...overrides,
});

function engine(tables) {
  return load("lib/leave-attendance-assessment.ts", {
    "server-only": {},
    "@/lib/supabaseServer": { supabaseAdmin: database(tables) },
    "@/lib/leave-schedule-query": reader,
  });
}

async function assess({ schedules = [schedule()], scans = [scan()], leaves = [] } = {}) {
  const result = await engine({
    leave_work_schedule_days: schedules,
    leave_attendance_records: scans,
    leave_requests: leaves,
  }).assessAttendanceRange(["e"], date, date);
  return result[0];
}

test("reports both late arrival and early departure", async () => {
  const result = await assess({ scans: [scan({ check_in: "08:10:00", check_out: "16:30:00" })] });
  assert.equal(result.lateMinutes, 10);
  assert.equal(result.earlyMinutes, 30);
});

test("morning leave uses 13:00 and counts half a day", async () => {
  const result = await assess({ leaves: [leave({ session: "AM", requestedDays: 0.5 })], scans: [scan({ check_in: "13:10:00" })] });
  assert.equal(result.expectedIn, "13:00");
  assert.equal(result.lateMinutes, 10);
  assert.equal(result.leaveDays, 0.5);
});

test("afternoon leave uses 13:00 and counts half a day", async () => {
  const result = await assess({ leaves: [leave({ session: "PM", requestedDays: 0.5 })], scans: [scan({ check_out: "12:45:00" })] });
  assert.equal(result.expectedOut, "13:00");
  assert.equal(result.earlyMinutes, 15);
  assert.equal(result.leaveDays, 0.5);
});

test("approved full-day leave overrides OFF and flags scans", async () => {
  const result = await assess({ schedules: [schedule({ day_type: "OFF", leave_work_schedule_intervals: [] })], leaves: [leave()] });
  assert.equal(result.leaveDays, 1);
  assert.match(result.text, /ลาป่วย/);
  assert.ok(result.warnings.some((warning) => warning.includes("ลาอนุมัติแต่พบสแกน")));
  assert.equal(result.lateMinutes, null);
});

test("pending/rejected/cancelled leave never overrides work", async () => {
  for (const status of ["PENDING", "REJECTED", "CANCELLED"]) {
    const result = await assess({ leaves: [leave({ status })] });
    assert.equal(result.leaveDays, 0);
    assert.equal(result.lateMinutes, 0);
  }
});

test("a missing scan is not absence and one missing clock is not normal attendance", async () => {
  const missing = await assess({ scans: [] });
  assert.match(missing.text, /ยังไม่มีข้อมูลสแกน/);
  assert.equal(missing.lateMinutes, null);
  const partial = await assess({ scans: [scan({ check_out: null })] });
  assert.match(partial.text, /ไม่ครบ/);
  assert.equal(partial.lateMinutes, null);
});

test("DRAFT is not a saved schedule and Settings is not queried", async () => {
  const result = await assess({ schedules: [schedule({ state: "DRAFT" })] });
  assert.equal(result.scheduledType, null);
  assert.ok(result.warnings.includes("ยังไม่จัดตาราง"));
  assert.equal(result.lateMinutes, null);
});

test("OFF with scans is flagged", async () => {
  const result = await assess({ schedules: [schedule({ day_type: "OFF", leave_work_schedule_intervals: [] })] });
  assert.equal(result.text, "OFF");
  assert.ok(result.warnings.includes("วันหยุดแต่พบสแกน"));
});

test("ambiguous leave totals and overlapping leave are not silently added", async () => {
  for (const leaves of [[leave({ requestedDays: null })], [leave({ requestedDays: "invalid" })], [leave(), leave({ id: "second" })]]) {
    assert.equal((await assess({ leaves })).leaveDays, null);
  }
});

test("AM and PM approved leaves make one full day", async () => {
  const result = await assess({ leaves: [leave({ session: "AM", requestedDays: 0.5 }), leave({ id: "pm", session: "PM", requestedDays: 0.5 })] });
  assert.equal(result.leaveDays, 1);
  assert.equal(result.lateMinutes, null);
});

test("out-of-shift half-day boundary, split and overnight shifts require review", async () => {
  const overnight = schedule({ leave_work_schedule_intervals: [{ sequence: 1, starts_at: `${date}T22:00:00+07:00`, ends_at: "2026-10-23T07:00:00+07:00" }] });
  const result = await assess({ schedules: [overnight], scans: [scan({ check_in: "22:10:00", check_out: "07:00:00" })] });
  assert.match(result.text, /กะข้ามคืน/);
  assert.equal(result.lateMinutes, null);
  const half = await assess({ schedules: [overnight], leaves: [leave({ session: "AM", requestedDays: 0.5 })] });
  assert.ok(half.warnings.some((warning) => warning.includes("อยู่นอกช่วงกะ")));
  const split = await assess({ schedules: [schedule({ leave_work_schedule_intervals: [...schedule().leave_work_schedule_intervals, { sequence: 2, starts_at: `${date}T18:00:00+07:00`, ends_at: `${date}T20:00:00+07:00` }] })] });
  assert.equal(split.lateMinutes, null);
  assert.ok(split.warnings.some((warning) => warning.includes("งานหลายช่วง")));
});

test("Bangkok midnight, end-date inclusion and cross-period leave", async () => {
  const row = leave({ startDate: "2026-10-21T17:00:00Z", endDate: "2026-10-23T17:00:00Z", requestedDays: 3 });
  assert.equal((await assess({ leaves: [row] })).leaveDays, 1);
  const lastDay = leave({ startDate: `${date}T18:00:00+07:00`, endDate: `${date}T18:00:00+07:00` });
  assert.equal((await assess({ leaves: [lastDay] })).leaveDays, 1);
});

test("pagination and multiple employee chunks retain all records", async () => {
  const ids = Array.from({ length: 202 }, (_, index) => `e${index}`);
  const rows = ids.flatMap((id) => [0, 1, 2, 3, 4, 5].map((offset) => schedule({ employee_id: id, work_date: `2026-10-${22 + offset}`, id: `${id}-${offset}` })));
  const result = await engine({ leave_work_schedule_days: rows }).assessAttendanceRange(ids, "2026-10-22", "2026-10-27");
  assert.equal(result.length, 1212);
  assert.ok(result.every((item) => item.scheduledType === "WORK"));
});

test("invalid dates and overly long ranges are rejected", async () => {
  for (const [from, to] of [["2026-02-30", date], [date, "2026-10-21"], ["2025-01-01", "2026-10-22"]]) {
    await assert.rejects(engine({}).assessAttendanceRange(["e"], from, to));
  }
});

function reports(tables, allowedIds, permitted = true) {
  return load("app/leave/api/reports/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    "@/lib/supabaseServer": { supabaseAdmin: database(tables) },
    "@/lib/leave-attendance-assessment": engine(tables),
    "@/lib/leave-schedule-query": reader,
    "@/lib/auth/requirePortalAccess": {
      requirePermission: async () => permitted
        ? { ok: true, access: {} }
        : { ok: false, response: { status: 403 } },
    },
    "@/lib/auth/requireScopedAccess": { applyEmployeeScope: (query) => query.in("id", allowedIds) },
  });
}

test("Reports returns daily assessments independent of the request-status filter", async () => {
  const tables = {
    employees: [{ id: "e", is_deleted: false, employee_code: "00123", first_name_th: "Test" }, { id: "other", is_deleted: false }],
    leave_requests: [leave(), leave({ id: "pending", status: "PENDING" }), leave({ id: "private", employeeId: "other" })],
    leave_work_schedule_days: [schedule()],
    leave_attendance_records: [scan()],
  };
  const response = await reports(tables, ["e"]).GET({ url: `http://localhost/leave/api/reports?from=${date}&to=${date}&status=PENDING` });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0].status, "PENDING");
  assert.equal(response.body.employees.length, 1);
  assert.equal(response.body.employees[0].dailyResults[0].leaveDays, 1);
  // Later cancellation is reflected on the next report, without re-importing.
  tables.leave_requests[0].status = "CANCELLED";
  const updated = await reports(tables, ["e"]).GET({ url: `http://localhost/leave/api/reports?from=${date}&to=${date}` });
  assert.equal(updated.body.employees[0].dailyResults[0].leaveDays, 0);
});

test("Reports checks access and rejects invalid dates", async () => {
  const forbidden = await reports({}, [], false).GET({ url: "http://localhost" });
  assert.equal(forbidden.status, 403);
  const invalid = await reports({}, []).GET({ url: "http://localhost?from=2026-02-30&to=2026-10-22" });
  assert.equal(invalid.status, 400);
});

test("Reports includes requests in the last day and reads more than one employee chunk", async () => {
  const employees = Array.from({ length: 202 }, (_, index) => ({ id: `e${index}`, is_deleted: false }));
  const tables = { employees, leave_requests: employees.map((employee) => leave({ id: employee.id, employeeId: employee.id, startDate: `${date}T18:00:00+07:00`, endDate: `${date}T18:00:00+07:00` })) };
  const response = await reports(tables, employees.map((employee) => employee.id)).GET({ url: `http://localhost?from=${date}&to=${date}` });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 202);
  assert.equal(response.body.employees.length, 202);
  assert.ok(response.body.employees.every((employee) => employee.dailyResults[0].leaveDays === 1));
});

test("Excel renders API daily results, preserves leading-zero codes and escapes names", async () => {
  const source = fs.readFileSync(path.join(__dirname, "../app/leave/reports/page.tsx"), "utf8");
  const helpers = source.slice(source.indexOf("const leaveColorMap:"), source.indexOf("export default function LeaveReportsPage"));
  const start = source.indexOf("  const exportExcel =");
  const exportCode = source.slice(start, source.indexOf("\n  return (", start));
  let generatedHtml = "";
  const result = await assess({ leaves: [leave()], scans: [scan()] });
  const code = ts.transpileModule(helpers + exportCode + "\nexportExcel();", {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    from: date, to: date, loading: false,
    exportEmployees: [{ employeeId: "e", employeeCode: "00123", employeeName: "<Employee>", department: "A", division: "B", unit: "C", dailyResults: [result] }],
    alert(message) { throw new Error(message); },
    Blob: class { constructor(parts) { generatedHtml = parts.join(""); } },
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
    document: { createElement: () => ({ click() {} }) },
  });
  assert.match(generatedHtml, /00123/);
  assert.match(generatedHtml, /&lt;Employee&gt;/);
  assert.match(generatedHtml, /ลาป่วย เต็มวัน/);
  assert.match(generatedHtml, /ลาอนุมัติแต่พบสแกน/);
  assert.match(generatedHtml, /สแกน 08:00–17:00/);
  assert.doesNotMatch(generatedHtml, /<Employee>/);
});
