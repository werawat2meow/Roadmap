import { applicationPerson, canAccessApplication } from "./application.mjs";
import { employeePhoto, normalizedStatus } from "./domain.mjs";

// Advance by rows actually returned: a server max-rows lower than pageSize must
// never silently truncate a report. Every query has a deterministic UUID order.
export async function readAll(makeQuery, pageSize = 500) {
  const rows = [];
  let lastId = null;
  for (;;) {
    let query = makeQuery().order("id", { ascending: true }).limit(pageSize);
    if (lastId) query = query.gt("id", lastId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return rows;
    const nextId = data[data.length - 1].id;
    if (!nextId || nextId === lastId) throw new Error("Invalid pagination cursor");
    rows.push(...data);
    lastId = nextId;
  }
}

export async function readByIds(db, table, columns, field, ids, transform = (q) => q) {
  const unique = [...new Set(ids.filter(Boolean))];
  const rows = [];
  for (let offset = 0; offset < unique.length; offset += 80) {
    const batch = unique.slice(offset, offset + 80);
    rows.push(...await readAll(() => transform(db.from(table).select(columns).in(field, batch))));
  }
  return rows;
}

const index = (rows) => new Map(rows.map((row) => [row.id, row]));
const name = (first, last) => [first?.trim(), last?.trim()].filter(Boolean).join(" ");

export async function orientationData(db, guard, { applicationId, employeeId } = {}) {
  const applications = await readAll(() => {
    const query = db.from("recruit_job_applications")
    .select("id,emp_id,first_name,last_name,nickname_th,nickname_en,start_date,hire_date,profile_image_url,created_at,status,company_id,branch_id,department_id,division_id,unit_id,position_id,position_level_id")
      .in("status", [15, 17]);
    return applicationId ? query.eq("id", applicationId) : employeeId ? query.eq("emp_id", employeeId) : query;
  });
  const employees = await readByIds(db, "employees",
    "id,company_id,employee_code,first_name_th,last_name_th,first_name_en,last_name_en,nickname_th,nickname_en,nick_name,branch_id,department_id,division_id,unit_id,position_id,position_level_id,start_work_date,hire_date",
    "id", applications.map((row) => row.emp_id));
  const employeeMap = index(employees);
  const allowedApplications = applications.filter((row) => canAccessApplication(guard, row, employeeMap.get(row.emp_id)));
  const participants = await readByIds(db, "recruit_orientation_participants",
    "id,session_id,application_id,employee_id,start_work_date,branch_id,department_id,position_id,position_level_id,branch_code_snapshot,branch_name_snapshot,department_name_snapshot,position_name_snapshot,position_level_code_snapshot,attendance_status,attended_at,attendance_note,reschedule_date,site_visit_status,site_visited_at,site_visit_note,workflow_status,completed_at",
    "application_id", allowedApplications.map((row) => row.id));
  const participantMap = new Map();
  for (const row of participants) {
    // Fail explicitly instead of arbitrarily choosing a historic/duplicate row.
    if (participantMap.has(row.application_id)) throw new Error("ORIENTATION_DUPLICATE_PARTICIPANT");
    participantMap.set(row.application_id, row);
  }
  const eligible = allowedApplications.filter((app) => {
    const p = participantMap.get(app.id);
    const employee = employeeMap.get(app.emp_id);
    return canAccessApplication(guard, app, employee, p);
  });
  const people = eligible.map(app => applicationPerson(app, employeeMap.get(app.emp_id)));
  const related = eligible.map((app) => participantMap.get(app.id)).filter(Boolean);
  const [sessions, branches, departments, positions, levels, documents] = await Promise.all([
    readByIds(db, "recruit_orientation_sessions", "id,session_code,session_name,orientation_date,start_time,end_time,location_id,location_name_snapshot,status", "id", related.map((row) => row.session_id)),
    readByIds(db, "branches", "id,branch_code,branch_name,branch_image_url", "id", [...people.map((row) => row.branch_id), ...related.map((row) => row.branch_id)]),
    readByIds(db, "departments", "id,department_name", "id", [...people.map((row) => row.department_id), ...related.map((row) => row.department_id)]),
    readByIds(db, "positions", "id,position_name", "id", [...people.map((row) => row.position_id), ...related.map((row) => row.position_id)]),
    readByIds(db, "position_levels", "id,level_code", "id", [...people.map((row) => row.position_level_id), ...related.map((row) => row.position_level_id)]),
    readByIds(db, "recruit_job_documents", "id,application_id,document_type,file_url,created_at", "application_id", eligible.map((row) => row.id), (q) => q.eq("document_type", "photo")),
  ]);
  const locations = await readByIds(db, "recruit_orientation_locations", "id,location_name,color_hex", "id", sessions.map((row) => row.location_id));
  const [sessionMap, branchMap, departmentMap, positionMap, levelMap, locationMap] = [sessions, branches, departments, positions, levels, locations].map(index);
  const rows = eligible.map((app) => {
    const employee = employeeMap.get(app.emp_id) || {};
    const e = { ...employee, ...applicationPerson(app, employee) };
    const p = participantMap.get(app.id);
    const s = sessionMap.get(p?.session_id);
    const b = branchMap.get(p?.branch_id ?? e.branch_id);
    const location = locationMap.get(s?.location_id);
    return {
      employee_id: app.emp_id || null, application_id: app.id, application_status: app.status, participant_id: p?.id || null,
      employee_code: e.employee_code || "", full_name: name(e.first_name_th, e.last_name_th) || name(e.first_name_en, e.last_name_en) || name(app.first_name, app.last_name),
      nickname: e.nickname_th || app.nickname_th || e.nickname_en || app.nickname_en || e.nick_name || "",
      branch_id: p?.branch_id ?? e.branch_id, branch_code: p?.branch_code_snapshot ?? b?.branch_code ?? "",
      branch_name: p?.branch_name_snapshot ?? b?.branch_name ?? "", branch_logo_url: b?.branch_image_url || null,
      department_id: p?.department_id ?? e.department_id,
      department_name: p?.department_name_snapshot ?? departmentMap.get(p?.department_id ?? e.department_id)?.department_name ?? "",
      position_name: p?.position_name_snapshot ?? positionMap.get(p?.position_id ?? e.position_id)?.position_name ?? "",
      level_code: p?.position_level_code_snapshot ?? levelMap.get(p?.position_level_id ?? e.position_level_id)?.level_code ?? "",
      start_work_date: p?.start_work_date ?? app.start_date ?? e.start_work_date ?? app.hire_date ?? e.hire_date,
      session_id: s?.id || null, session_name: s?.session_name || s?.session_code || "", session_status: s?.status || null,
      orientation_date: s?.orientation_date || null, location_name: s?.location_name_snapshot ?? location?.location_name ?? "",
      location_color: /^#[0-9a-f]{6}$/i.test(location?.color_hex || "") ? location.color_hex : "#e2e8f0",
      attendance_status: normalizedStatus(p?.attendance_status) || "pending", workflow_status: normalizedStatus(p?.workflow_status) || "unassigned",
      site_visit_status: normalizedStatus(p?.site_visit_status) || "pending", completed_at: p?.completed_at || null,
      photo_url: employeePhoto(app, documents),
    };
  });
  return { rows, sessions };
}
