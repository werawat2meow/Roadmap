const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(relative, dependencies = {}) {
  const filename = path.join(__dirname, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, URL, console: { log() {}, error() {} },
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename });
  return exports;
}

// Run the real handlers against isolated rows, never a live employee database.
function database(tables = {}) {
  let sequence = 0;
  const writes = [];
  return {
    tables, writes,
    from(table) {
      tables[table] ||= [];
      let filters = [], operation = "read", payload, limit;
      const query = {
        select() { return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        in(key, values) { filters.push(row => values.includes(row[key])); return query; },
        lte(key, value) { filters.push(row => row[key] <= value); return query; },
        or(expression) {
          const dateRange = expression.match(/^and\(approved_at\.gte\.([^,]+),approved_at\.lt\.([^\)]+)\)/);
          if (dateRange) {
            filters.push(row => {
              const date = Date.parse(row.approved_at || row.created_at);
              return date >= Date.parse(dateRange[1]) && date < Date.parse(dateRange[2]);
            });
          }
          return query;
        },
        order() { return query; },
        limit(value) { limit = value; return query; },
        async range(from, to) {
          const result = await execute(false);
          return { ...result, data: result.data.slice(from, to + 1) };
        },
        update(value) { operation = "update"; payload = value; return query; },
        insert(value) { operation = "insert"; payload = value; return query; },
        delete() { operation = "delete"; return query; },
        then(resolve, reject) { return execute(false).then(resolve, reject); },
        maybeSingle() { return execute(true); },
        single() { return execute(true, true); },
      };
      async function execute(single, required = false) {
        let rows = tables[table].filter(row => filters.every(filter => filter(row)));
        if (operation === "insert") {
          rows = (Array.isArray(payload) ? payload : [payload]).map(value => ({ id: `test-${++sequence}`, ...value }));
          tables[table].push(...rows);
        } else if (operation === "update") rows.forEach(row => Object.assign(row, payload));
        else if (operation === "delete") tables[table] = tables[table].filter(row => !rows.includes(row));
        if (operation !== "read") writes.push({ table, operation });
        if (limit) rows = rows.slice(0, limit);
        if (required && rows.length !== 1) {
          return { data: null, error: { code: "PGRST116", message: "Cannot coerce the result to a single JSON object" } };
        }
        return { data: single ? rows[0] || null : rows, error: null };
      }
      return query;
    },
  };
}

const validation = load("evaluations/validation.ts");
const reportPeriod = load("reports/reportPeriod.ts");
const json = (body, options) => ({ status: options?.status || 200, body });
const dependencies = db => ({
  "../reportPeriod": reportPeriod,
  "next/server": { NextResponse: { json } },
  "@/lib/supabaseServer": { supabaseAdmin: db },
  "@/lib/roadmap/auditLog": { writeRoadmapAuditLog: async () => {} },
  "@/lib/auth/getAuthenticatedUser": { getAuthenticatedUser: async () => ({ user: { id: "account" } }) },
});
function evaluations(db) {
  return load("evaluations/route.ts", {
    ...dependencies(db),
    "./validation": validation,
    "@/lib/notifications/createNotification": { createNotification: async () => {} },
    "@/lib/roadmap/cycleHelper": { getEvaluationCycleInfo: () => ({ isNominationPeriod: true }) },
    "@/lib/roadmap/cycleSettingsServer": { getRoadmapCycleSettings: async () => ({}) },
    "@/lib/roadmap/permissions": { requireRoadmapPermission: async () => true },
  });
}
const request = body => ({ json: async () => body });
const valid = overrides => ({
  employeeId: "employee", evaluatorId: "reviewer", evaluationTypeId: "type",
  managerIds: ["reviewer"], status: "Submitted", totalScore: 4, maxScore: 5,
  companyScore: 4, departmentScore: 0, expectationScore: 0,
  scores: [{ categoryItemId: "item", score: 4, max: 5 }], ...overrides,
});

test("HR and MGR payloads, incomplete drafts, decimal scores and free-text Expectations remain valid", () => {
  assert.equal(validation.validateEvaluationScores(valid()), null);
  assert.equal(validation.validateEvaluationScores({ status: "Draft" }), null);
  assert.equal(validation.validateEvaluationScores(valid({ totalScore: 0, companyScore: 0, maxScore: 0, status: "Draft", scores: [] })), null);
  assert.equal(validation.validateEvaluationScores(valid({ totalScore: 3.5, scores: [{ categoryItemId: "item", score: 3.5 }] })), null);
  const mgr = valid({ scores: [{ categoryItemId: "item", score: 4 }], extra_data: { companyRows: [{ itemId: "item", score: 4, maxScore: 5 }] } });
  assert.equal(validation.validateEvaluationScores(mgr), null);
  assert.equal(validation.validateEvaluationScores(valid({ scores: [], extra_data: { expectationRows: [{ topic: "Goal", maxScore: 5, score: 4 }] } })), null);
});

test("reject negative/nonfinite scores, over-max summaries, HR/MGR rows and empty submissions", () => {
  for (const bad of [
    { totalScore: -1 }, { totalScore: Infinity }, { maxScore: NaN }, { totalScore: 9999 },
    { scores: [{ categoryItemId: "item", score: -1 }] },
    { scores: [{ categoryItemId: "item", score: 6, max: 5 }] },
    { scores: [{ categoryItemId: "item", score: 4 }], extra_data: { companyRows: [{ itemId: "item", maxScore: 3, score: 4 }] } },
    { scores: [] }, { maxScore: 0 },
  ]) assert.ok(validation.validateEvaluationScores(valid(bad)), JSON.stringify(bad));
});

test("reject illegal statuses and terminal-record edits without writing anything", async () => {
  for (const status of ["Completed", "Rejected", "SalaryUpdated"]) {
    const db = database({ rm_evaluations: [{ id: "e", employee_id: "employee", status }] });
    const result = await evaluations(db).POST(request(valid({ evaluationId: "e", status: "Draft" })));
    assert.equal(result.status, 409);
    assert.equal(db.writes.length, 0);
  }
  const db = database();
  assert.equal((await evaluations(db).POST(request(valid({ status: "WRONG" })))).status, 400);
  assert.equal(db.writes.length, 0);
});

test("missing evaluation, unassigned evaluator and missing reviewers do not mutate records", async () => {
  for (const [tables, body, expected] of [
    [{}, valid({ evaluationId: "missing" }), 404],
    [{}, valid({ managerIds: [] }), 400],
    [{ rm_evaluations: [{ id: "e", employee_id: "employee", status: "Draft" }], rm_evaluation_reviewers: [{ evaluation_id: "e", manager_id: "other" }] }, valid({ evaluationId: "e" }), 403],
  ]) {
    const db = database(tables);
    assert.equal((await evaluations(db).POST(request(body))).status, expected);
    assert.equal(db.writes.length, 0);
  }
});

test("normal nomination, HR draft preparation and manager submission still work", async () => {
  const db = database();
  const route = evaluations(db);
  const nominated = await route.POST(request(valid({ status: "Nominated" })));
  assert.equal(nominated.body.data.status, "Nominated");
  const id = nominated.body.data.id;
  assert.equal((await route.POST(request(valid({ evaluationId: id, status: "Draft" })))).body.data.status, "Draft");
  const submitted = await route.POST(request(valid({ evaluationId: id })));
  assert.equal(submitted.body.data.status, "Submitted");
  assert.equal(submitted.body.isFullyCompleted, true);
});

test("MGR zero-score placeholder rows do not block valid submission", async () => {
  const db = database();
  const response = await evaluations(db).POST(request(valid({
    scores: [{ categoryItemId: "item", score: 4 }, { categoryItemId: "", score: 0 }],
    extra_data: { companyRows: [{ itemId: "item", score: 4, maxScore: 5 }, { itemId: "", score: 0, maxScore: 0 }] },
  })));
  assert.equal(response.body.data.status, "Submitted");
  assert.equal(db.tables.rm_evaluation_reviewer_scores.length, 1);
});

test("two reviewers wait for each other and keep the existing averaging behavior", async () => {
  const db = database();
  const route = evaluations(db);
  const created = await route.POST(request(valid({ status: "Draft", managerIds: ["reviewer", "second"] })));
  const id = created.body.data.id;
  const first = await route.POST(request(valid({ evaluationId: id })));
  assert.equal(first.body.data.status, "In_Review");
  assert.equal(first.body.submittedCount, 1);
  assert.equal(first.body.totalReviewers, 2);
  const second = await route.POST(request(valid({ evaluationId: id, evaluatorId: "second", totalScore: 2, companyScore: 2, scores: [{ categoryItemId: "item", score: 2, max: 5 }] })));
  assert.equal(second.body.data.status, "Submitted");
  assert.equal(second.body.data.totalScore, 3);
});

test("free-text-only Expectations submission still completes the assigned reviewer", async () => {
  const db = database();
  const body = valid({ scores: [], extra_data: { expectationRows: [{ topic: "Goal", maxScore: 5, score: 4 }] } });
  const response = await evaluations(db).POST(request(body));
  assert.equal(response.body.data.status, "Submitted");
  assert.equal(response.body.isFullyCompleted, true);
});

test("Management rejects missing records, Draft and terminal records, and blank reasons", async () => {
  for (const status of [undefined, "Draft", "In_Review", "Completed", "Rejected", "SalaryUpdated"]) {
    const db = database({ rm_evaluations: status ? [{ id: "e", status }] : [] });
    const route = load("executive/status/route.ts", dependencies(db));
    const result = await route.POST(request({ evaluationId: "e", action: "approve", approvalNote: "Approved" }));
    assert.equal(result.status, status ? 409 : 404);
    assert.equal(db.writes.length, 0);
  }
  for (const action of ["approve", "reject", "return"]) {
    const db = database({ rm_evaluations: [{ id: "e", status: "Submitted" }] });
    const route = load("executive/status/route.ts", dependencies(db));
    assert.equal((await route.POST(request({ evaluationId: "e", action, approvalNote: " ", rejectionNote: " " }))).status, 400);
    assert.equal(db.writes.length, 0);
  }
});

test("normal approve/reject/return still work; returned reviewers reset and can resubmit", async () => {
  for (const action of ["approve", "reject", "return"]) {
    const db = database({
      rm_evaluations: [{ id: "e", employee_id: "employee", status: "Submitted", rm_evaluation_types: { name: "Probation" } }],
      rm_evaluation_reviewers: [{ id: "r", evaluation_id: "e", manager_id: "reviewer", status: "Submitted" }],
    });
    const route = load("executive/status/route.ts", dependencies(db));
    assert.equal((await route.POST(request({ evaluationId: "e", action, approvalNote: "Approved", rejectionNote: "Reason" }))).status, 200);
    const expected = { approve: "Completed", reject: "Rejected", return: "Returned" }[action];
    assert.equal(db.tables.rm_evaluations[0].status, expected);
    if (action === "return") {
      assert.equal(db.tables.rm_evaluation_reviewers[0].status, "Draft");
      assert.equal((await evaluations(db).POST(request(valid({ evaluationId: "e" })))).body.data.status, "Submitted");
    }
  }
});

test("Management does not overwrite a concurrent status change", async () => {
  const db = database({ rm_evaluations: [{ id: "e", status: "Submitted" }] });
  const from = db.from.bind(db);
  db.from = table => {
    const query = from(table);
    const update = query.update;
    query.update = value => {
      if (table === "rm_evaluations") db.tables.rm_evaluations[0].status = "Completed";
      return update(value);
    };
    return query;
  };
  const route = load("executive/status/route.ts", dependencies(db));
  const response = await route.POST(request({ evaluationId: "e", action: "reject", rejectionNote: "Reason" }));
  assert.equal(response.status, 409);
  assert.equal(db.tables.rm_evaluations[0].status, "Completed");
  assert.equal(db.tables.rm_evaluations[0].rejection_note, undefined);
});

test("missing report type returns an empty successful report instead of 500", async () => {
  const route = load("reports/evaluation-history/route.ts", dependencies(database()));
  const response = await route.GET({ url: "http://test/reports?type=annual-evaluation" });
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.length, 0);
});

test("Management uses the existing evaluation grade boundaries", async () => {
  for (const [score, grade] of [[85, "A"], [80, "B"], [75, "B"], [70, "C"], [65, "C"], [60, "D"], [50, "D"], [49, "F"]]) {
    const db = database({ rm_evaluations: [{ id: "e", employee_id: "employee", status: "Submitted", totalScore: score, maxScore: 100 }], employees: [{ id: "employee" }] });
    const route = load("executive/route.ts", dependencies(db));
    const response = await route.GET();
    assert.equal(response.body.employees[0].grade, grade);
  }
});

test("decimal grades match saved evaluations in Management and Preview for all five types", async () => {
  const cases = [
    [84.6, 100, "B"], [84.99, 100, "B"], [85, 100, "A"],
    [74.6, 100, "C"], [74.99, 100, "C"], [75, 100, "B"],
    [64.6, 100, "D"], [64.99, 100, "D"], [65, 100, "C"],
    [49.6, 100, "F"], [49.99, 100, "F"], [50, 100, "D"],
    [4.23, 5, "B"], [84.999, 100, "A"],
  ];
  for (const type of ["Probation", "Progression", "Performance", "Promote", "Annual evaluation"]) {
    for (const [score, max, expectedGrade] of cases) {
      const db = database({ employees: [{ id: "employee" }] });
      const saved = await evaluations(db).POST(request(valid({
        evaluationType: type, totalScore: score, companyScore: score, maxScore: max,
        scores: [{ categoryItemId: "item", score, max }],
      })));
      assert.equal(saved.status, 200);
      assert.equal(saved.body.data.grade, expectedGrade, `${type}: ${score}/${max}`);
      // Supply joined metadata as returned by Supabase, without changing the grade.
      Object.assign(saved.body.data, {
        created_at: "2026-11-09T00:00:00Z", rm_evaluation_types: { name: type },
      });
      const management = await load("executive/route.ts", dependencies(db)).GET();
      const preview = await load("reports/evaluation-preview/route.ts", dependencies(db)).GET({
        url: `http://test/preview?id=${saved.body.data.id}`,
      });
      assert.equal(preview.status, 200);
      assert.equal(management.body.employees[0].grade, expectedGrade);
      assert.equal(preview.body.data.grade, expectedGrade);
      assert.equal(management.body.employees[0].score, Math.round((score / max) * 100 * 100) / 100);
    }
  }
});

test("Reports respects assessment periods, month/year selections and Bangkok legacy dates for every type", async () => {
  const dates = [
    ["nov-2026", "2026-11-07T00:00:00Z", "2026-09-01T00:00:00Z"],
    ["sep-2026", "2026-09-17T00:00:00Z", "2026-11-01T00:00:00Z"],
    ["nov-2025", "2025-11-07T00:00:00Z"],
    ["nov-start", "2026-10-31T17:00:00Z"],
    ["nov-end", "2026-11-30T16:59:59.999Z"],
    ["before-nov", "2026-10-31T16:59:59.999Z"],
    ["after-nov", "2026-11-30T17:00:00Z"],
    ["legacy-2026", null, "2026-11-15T00:00:00Z"],
    ["legacy-2025", null, "2025-11-15T00:00:00Z"],
    ["jan-2027", "2026-12-31T17:00:00Z"],
    ["leap-feb", "2024-02-29T16:59:59.999Z"],
    ["march-2024", "2024-02-29T17:00:00Z"],
    ["jan-2026", "2025-12-31T17:00:00Z"],
  ];
  const november2026 = ["nov-2026", "nov-start", "nov-end", "legacy-2026"];
  const cases = [
    ["month=11", [...november2026, "nov-2025", "legacy-2025"]],
    ["month=11&year=2026", november2026],
    ["month=11&year=2025", ["nov-2025", "legacy-2025"]],
    ["year=2026", [...november2026, "sep-2026", "before-nov", "after-nov", "jan-2026"]],
    ["month=1&year=2027", ["jan-2027"]],
    ["month=2", ["leap-feb"]],
    ["month=3&year=2024", ["march-2024"]],
    ["month=4", []],
    ["", dates.map(([id]) => id)],
  ];
  for (const type of ["Probation", "Progression", "Performance", "Promote", "Annual evaluation"]) {
    for (const [params, expected] of cases) {
      const rows = dates.map(([id, approved_at, created]) => ({
        id, approved_at: "2027-01-01T00:00:00Z", created_at: created || approved_at,
        evaluation_period: id === "nov-2026" ? "2026-10-01 - 2026-11-30" :
          id === "sep-2026" ? "2026-08-20 - 2026-09-21" : null,
        employee_id: "employee", evaluation_type_id: "type",
        status: id === "legacy-2026" ? "SalaryUpdated" : "Completed",
      }));
      rows.push({ ...rows[0], id: "rejected", status: "Rejected" });
      rows.push({ ...rows[0], id: "other-type", evaluation_type_id: "other" });
      const db = database({ rm_evaluation_types: [{ id: "type", name: type }], rm_evaluations: rows, employees: [{ id: "employee" }] });
      const slug = type === "Annual evaluation" ? "annual-evaluation" : type.toLowerCase();
      const response = await load("reports/evaluation-history/route.ts", dependencies(db)).GET({
        url: `http://test/reports?type=${slug}&${params}`,
      });
      assert.equal(response.status, 200);
      assert.deepEqual(Array.from(response.body.data, row => row.id).sort(), [...expected].sort(), `${type}: ${params}`);
    }
  }
});

test("all-years month filter includes matches beyond the first database page", async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({
    id: `september-${i}`, employee_id: "employee", evaluation_type_id: "type",
    status: "Completed", approved_at: "2026-09-01T00:00:00Z", created_at: "2026-09-01T00:00:00Z",
  }));
  rows.push({ ...rows[0], id: "november-later-page", evaluation_period: "2025-11-01 - 2025-11-30" });
  const db = database({ rm_evaluation_types: [{ id: "type", name: "Probation" }], rm_evaluations: rows, employees: [{ id: "employee" }] });
  const response = await load("reports/evaluation-history/route.ts", dependencies(db)).GET({
    url: "http://test/reports?type=probation&month=11",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(Array.from(response.body.data, row => row.id), ["november-later-page"]);
});

test("report date uses the assessment end, stored extra period, then legacy creation date", () => {
  assert.equal(reportPeriod.getReportPeriodDate({ evaluation_period: "2026-08-20 - 2026-09-21", created_at: "2026-11-01T00:00:00Z" }), "2026-09-21");
  assert.equal(reportPeriod.getReportPeriodDate({ extra_data: { evaluationPeriod: "2025-12-01 - 2026-01-31" }, created_at: "2026-02-01T00:00:00Z" }), "2026-01-31");
  assert.equal(reportPeriod.getReportPeriodDate({ evaluation_period: "2026-02-31", created_at: "2026-10-31T17:00:00Z" }), "2026-11-01");
  assert.equal(reportPeriod.getReportPeriodDate({ evaluation_period: "", created_at: "2026-10-31T16:59:59Z" }), "2026-10-31");
  assert.equal(reportPeriod.getReportPeriodDate({ evaluation_period: "2024-02-01 - 2024-02-29" }), "2024-02-29");
  assert.equal(reportPeriod.getReportPeriodDate({}), null);
});

test("September assessments approved in November stay in September and Preview agrees for every type", async () => {
  for (const type of ["Probation", "Progression", "Performance", "Promote", "Annual evaluation"]) {
    const db = database({
      rm_evaluation_types: [{ id: "type", name: type }],
      rm_evaluations: [{
        id: "e", employee_id: "employee", evaluation_type_id: "type", status: "Completed",
        evaluation_period: "2026-08-20 - 2026-09-21", created_at: "2026-10-01T00:00:00Z",
        approved_at: "2026-11-07T08:51:06Z", rm_evaluation_types: { name: type },
      }],
      employees: [{ id: "employee" }],
    });
    const route = load("reports/evaluation-history/route.ts", dependencies(db));
    const slug = type === "Annual evaluation" ? "annual-evaluation" : type.toLowerCase();
    const september = await route.GET({ url: `http://test/reports?type=${slug}&month=9&year=2026` });
    const november = await route.GET({ url: `http://test/reports?type=${slug}&month=11&year=2026` });
    assert.equal(september.body.data.length, 1);
    assert.equal(november.body.data.length, 0);
    assert.equal(september.body.data[0].latestDate, "2026-09-21");
    assert.equal(september.body.data[0].approvedAt, "2026-11-07T08:51:06Z");
    const preview = await load("reports/evaluation-preview/route.ts", dependencies(db)).GET({ url: "http://test/preview?id=e" });
    assert.equal(preview.body.data.submittedMonth, "กันยายน 2569");
  }
});
