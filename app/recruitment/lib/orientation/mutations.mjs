import { applicationPerson, canAccessApplication } from "./application.mjs";
import { createHash, randomUUID } from "node:crypto";
import { readAll } from "./readData.mjs";
import { photoCountError } from "./photoUpload.mjs";
import { bangkokDate, completionIssues, PHOTO_TYPES, normalizedStatus } from "./domain.mjs";
export { normalizedStatus } from "./domain.mjs";

const prefix = "recruit_orientation_";
export const mutationActions = ["location.create", "session.save", "assign", "attendance", "site_visit", "handover", "participant.close", "participant.reopen", "session.close", "session.reopen", "photo.add"];
export class OrientationError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function requireValue(condition, message, status = 400) { if (!condition) throw new OrientationError(message, status); }
export function uuid(value) {
  requireValue(typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value), "รหัสรายการไม่ถูกต้อง");
  return value;
}
function text(value, max = 2000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function idList(value, min, max) {
  requireValue(Array.isArray(value), "รายชื่อที่เลือกไม่ถูกต้อง");
  const ids = [...new Set(value.map(uuid))];
  requireValue(ids.length >= min && ids.length <= max, `เลือกรายชื่อ ${min}–${max} คน`);
  return ids;
}
function fullName(employee) {
  return [employee.first_name_th, employee.last_name_th].filter(Boolean).join(" ") || [employee.first_name_en, employee.last_name_en].filter(Boolean).join(" ");
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, canonical(value[key])]));
  return value;
}
export const requestHash = (payload) => createHash("sha256").update(JSON.stringify(canonical(payload))).digest("hex");

// Every database read used for a decision is replayed and compared by the RPC.
// No calls here mutate the database. Keep returned rows immutable.
export class WritePlan {
  constructor(db, actor, now = new Date().toISOString()) {
    this.db = db; this.actor = actor; this.now = now; this.expected = []; this.operations = []; this.cache = new Map();
  }
  async read(table, column, ids) {
    const unique = [...new Set(ids.filter(Boolean).map(uuid))].sort();
    if (!unique.length) return [];
    const key = JSON.stringify([table, column, unique]);
    if (this.cache.has(key)) return this.cache.get(key);
    const rows = [];
    for (let offset = 0; offset < unique.length; offset += 80) {
      const batch = unique.slice(offset, offset + 80);
      const data = await readAll(() => this.db.from(table).select("*").in(column, batch));
      this.expected.push({ table, column, ids: batch, rows: data }); rows.push(...data);
    }
    this.cache.set(key, rows); return rows;
  }
  async one(table, id) {
    const rows = await this.read(table, "id", [uuid(id)]);
    requireValue(rows.length === 1, "ไม่พบรายการ", 404); return rows[0];
  }
  insert(table, row) {
    const value = { id: randomUUID(), created_at: this.now, created_by: this.actor.id, ...row };
    this.operations.push({ table, kind: "insert", row: value }); return value;
  }
  update(table, id, row) {
    this.operations.push({ table, kind: "update", id, row: { ...row, updated_at: this.now, updated_by: this.actor.id } });
  }
}

export async function buildMutation(db, guard, payload, { photoMetadata, now } = {}) {
  const { action, request_id: requestId } = payload;
  requireValue(mutationActions.includes(action), "การดำเนินการไม่ถูกต้อง"); uuid(requestId);
  const fingerprint = requestHash(payload);
  const plan = new WritePlan(db, guard.user, now);
  let sessionId = null, participantId = null, before = null, after = null, result = {};
  const additionalHistory = [];
  const reason = text(payload.reason);
  const employee = async (id, own = false) => {
    const row = await plan.one("employees", id);
    requireValue(!row.is_deleted && ((own && row.id === guard.user.employee_id) || guard.canAccessEmployee(row)), "ไม่มีสิทธิ์เข้าถึงพนักงานนี้", 403);
    return row;
  };
  const application = async (id) => {
    const app = await plan.one("recruit_job_applications", id);
    requireValue([15, 17].includes(Number(app.status)), "ผู้เข้าร่วมต้องมีใบสมัครสถานะ 15 หรือ 17");
    const e = app.emp_id ? (await plan.read("employees", "id", [app.emp_id]))[0] : undefined;
    requireValue(canAccessApplication(guard, app, e), "ไม่มีสิทธิ์เข้าถึงใบสมัครนี้", 403);
    return { app, e, person: applicationPerson(app, e) };
  };
  const authorizeParticipant = async (p) => {
    const { app, e } = await application(p.application_id);
    requireValue(!p.employee_id || p.employee_id === app.emp_id, "ข้อมูลผู้เข้าร่วมไม่ตรงใบสมัคร กรุณาตรวจสอบ", 409);
    requireValue(canAccessApplication(guard, app, e, p), "ไม่มีสิทธิ์เข้าถึงสังกัด ณ รอบนี้", 403);
  };
  const session = async (id, whole = false, allowClosed = false) => {
    const s = await plan.one(prefix + "sessions", id);
    if (!allowClosed) requireValue(normalizedStatus(s.status) !== "closed", "รอบปิดแล้ว ต้องเปิดงานใหม่พร้อมเหตุผลก่อน");
    if (whole) {
      const people = await plan.read(prefix + "participants", "session_id", [s.id]);
      if (!people.length) requireValue(guard.hasAllScope || s.created_by === guard.user.id, "ไม่มีสิทธิ์จัดการรอบนี้", 403);
      for (const p of people) await authorizeParticipant(p);
    }
    return s;
  };
  const participant = async (id, allowCompleted = false) => {
    const p = await plan.one(prefix + "participants", id); await authorizeParticipant(p);
    if (!allowCompleted) requireValue(normalizedStatus(p.workflow_status) !== "completed", "รายการปิดแล้ว ต้องเปิดงานใหม่พร้อมเหตุผลก่อน");
    const s = await session(p.session_id); sessionId = s.id; participantId = p.id;
    return { p, s };
  };
  const sameDay = (value, s) => {
    requireValue(bangkokDate(s.orientation_date) && typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && bangkokDate(value) === s.orientation_date, "วันเวลาเข้าร่วม/Site Visit/ส่งมอบต้องตรงวันรอบตามเวลาไทย");
    return new Date(value).toISOString();
  };
  const evidence = async (p, s) => ({
    handovers: await plan.read(prefix + "handovers", "participant_id", [p.id]),
    photos: await plan.read(prefix + "photos", "session_id", [s.id]),
    links: await plan.read(prefix + "photo_participants", "participant_id", [p.id]),
  });
  const version = (row) => {
    if (payload.version !== undefined) requireValue(payload.version === (row.updated_at || row.created_at || null), "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
  };

  if (action === "location.create") {
    const name = text(payload.location_name, 200);
    requireValue(name && /^#[0-9a-f]{6}$/i.test(payload.color_hex || ""), "ระบุชื่อและสีสถานที่ให้ถูกต้อง");
    const row = plan.insert(prefix + "locations", { location_name: name, location_detail: text(payload.location_detail), color_hex: payload.color_hex, is_active: true });
    result = { id: row.id }; after = row;
  } else if (action === "session.save") {
    requireValue(text(payload.session_name, 200) && /^\d{4}-\d{2}-\d{2}$/.test(payload.orientation_date || "") && bangkokDate(payload.orientation_date), "ระบุชื่อรอบและวันที่ให้ถูกต้อง");
    requireValue(/^([01]\d|2[0-3]):[0-5]\d$/.test(payload.start_time || "") && /^([01]\d|2[0-3]):[0-5]\d$/.test(payload.end_time || "") && payload.start_time < payload.end_time, "เวลาเริ่มต้องก่อนเวลาสิ้นสุด");
    const location = await plan.one(prefix + "locations", payload.location_id);
    requireValue(location.is_active !== false, "สถานที่นี้ปิดใช้งานแล้ว");
    const ids = idList(payload.facilitator_ids || [], 0, 20);
    for (const id of ids) await employee(id);
    let s;
    const fields = { session_name: text(payload.session_name, 200), orientation_date: payload.orientation_date, start_time: payload.start_time, end_time: payload.end_time, location_id: location.id, location_name_snapshot: location.location_name, site_visit_location: text(payload.site_visit_location, 300), notes: text(payload.notes), status: payload.draft === false ? "open" : "draft", report_recipient: text(payload.report_recipient, 200) || "คุณม่อน", report_closing: text(payload.report_closing, 100) || "ค่ะ" };
    if (payload.session_id) {
      s = await session(payload.session_id, true); version(s); before = s;
      if (payload.report_recipient === undefined) fields.report_recipient = s.report_recipient || "คุณม่อน";
      if (payload.report_closing === undefined) fields.report_closing = s.report_closing || "ค่ะ";
      if (s.orientation_date !== fields.orientation_date || s.location_id !== fields.location_id) {
        const people = await plan.read(prefix + "participants", "session_id", [s.id]);
        const photos = await plan.read(prefix + "photos", "session_id", [s.id]);
        requireValue(!photos.length && people.every((p) => normalizedStatus(p.attendance_status) === "pending" && !p.attended_at && !p.site_visited_at), "รอบมีกิจกรรมแล้ว ไม่สามารถเปลี่ยนวันหรือสถานที่ได้");
      }
      plan.update(prefix + "sessions", s.id, fields);
      const facilitators = await plan.read(prefix + "facilitators", "session_id", [s.id]);
      before = { ...s, facilitator_ids: facilitators.map((f) => f.employee_id) };
      for (const f of facilitators) plan.operations.push({ table: prefix + "facilitators", kind: "delete", id: f.id });
    } else s = plan.insert(prefix + "sessions", { ...fields, session_code: `ORI-${requestId}` });
    for (const [index, id] of ids.entries()) plan.insert(prefix + "facilitators", { session_id: s.id, employee_id: id, sort_order: index });
    sessionId = s.id; after = { ...fields, facilitator_ids: ids }; result = { id: s.id };
  } else if (action === "assign") {
    let ids;
    if (payload.application_ids) ids = idList(payload.application_ids, 1, 50);
    else {
      // Old clients are accepted only when their employee identifies one application.
      ids = [];
      for (const employeeId of idList(payload.employee_ids, 1, 50)) {
        await employee(employeeId);
        const apps = (await plan.read("recruit_job_applications", "emp_id", [employeeId])).filter(app => [15, 17].includes(Number(app.status)));
        requireValue(apps.length === 1, "กรุณาโหลดหน้าใหม่และเลือกใบสมัครให้ชัดเจน", 409);
        ids.push(apps[0].id);
      }
    }
    const s = await session(payload.session_id, true); sessionId = s.id;
    const changes = [];
    for (const id of ids) {
      const { app, person: e } = await application(id);
      const existing = await plan.read(prefix + "participants", "application_id", [app.id]);
      requireValue(existing.length <= 1, "พบรายการ Orientation ซ้ำ", 409);
      const p = existing[0];
      if (p) {
        await authorizeParticipant(p); await session(p.session_id);
        requireValue(p.session_id !== s.id, "พนักงานอยู่ในรอบนี้แล้ว");
        requireValue(reason, "การเลื่อนรอบต้องระบุเหตุผล");
        const proof = await evidence(p, { id: p.session_id });
        requireValue(normalizedStatus(p.workflow_status) !== "completed" && normalizedStatus(p.attendance_status) !== "attended" && !proof.handovers.length && !proof.links.length, "ไม่สามารถเลื่อนรายการที่เข้าร่วมหรือมีหลักฐานแล้ว");
        const fields = { session_id: s.id, attendance_status: "pending", attended_at: null, attendance_note: reason, reschedule_date: null, site_visit_status: "pending", site_visited_at: null, site_visit_note: null, workflow_status: "draft" };
        plan.update(prefix + "participants", p.id, fields); changes.push({ before: p, after: fields });
        additionalHistory.push({ session_id: p.session_id, participant_id: p.id, before: p, after: fields });
        if (ids.length === 1) participantId = p.id;
      } else {
        const [b, d, position, level] = await Promise.all([
          e.branch_id ? plan.one("branches", e.branch_id) : null, e.department_id ? plan.one("departments", e.department_id) : null,
          e.position_id ? plan.one("positions", e.position_id) : null, e.position_level_id ? plan.one("position_levels", e.position_level_id) : null,
        ]);
        const row = plan.insert(prefix + "participants", { session_id: s.id, employee_id: app.emp_id || null, application_id: app.id, start_work_date: app.start_date || e.start_work_date || app.hire_date || e.hire_date, branch_id: e.branch_id, department_id: e.department_id, position_id: e.position_id, position_level_id: e.position_level_id, branch_code_snapshot: b?.branch_code || "", branch_name_snapshot: b?.branch_name || "", department_name_snapshot: d?.department_name || "", position_name_snapshot: position?.position_name || "", position_level_code_snapshot: level?.level_code || "", attendance_status: "pending", site_visit_status: "pending", workflow_status: "draft" });
        changes.push({ after: row });
        if (ids.length === 1) participantId = row.id;
      }
    }
    after = changes; result = { id: s.id, count: ids.length };
  } else if (["attendance", "site_visit", "handover", "participant.close", "participant.reopen"].includes(action)) {
    const { p, s } = await participant(payload.participant_id, action === "participant.reopen"); version(p); before = p;
    if (action === "attendance") {
      requireValue(["pending", "attended", "absent", "rescheduled"].includes(payload.attendance_status), "สถานะเช็กชื่อไม่ถูกต้อง");
      if (payload.attendance_status !== "attended") {
        const proof = await evidence(p, s);
        requireValue(!p.site_visited_at && !proof.handovers.length && !proof.links.length, "มี Site Visit/ส่งมอบ/หลักฐานแล้ว ไม่สามารถเปลี่ยนเป็นผู้ไม่เข้าร่วมได้");
      }
      if (payload.attendance_status === "rescheduled") requireValue(reason && /^\d{4}-\d{2}-\d{2}$/.test(payload.reschedule_date || "") && bangkokDate(payload.reschedule_date), "ระบุวันเลื่อนรอบและเหตุผล");
      after = { attendance_status: payload.attendance_status, attended_at: payload.attendance_status === "attended" ? sameDay(payload.at, s) : null, attendance_note: text(payload.notes) || reason, reschedule_date: payload.attendance_status === "rescheduled" ? payload.reschedule_date : null, workflow_status: "in_progress" };
    } else if (action === "site_visit") {
      requireValue(normalizedStatus(p.attendance_status) === "attended" && bangkokDate(p.attended_at) === s.orientation_date, "ต้องเช็กชื่อเข้าร่วมในวันรอบก่อน");
      after = { site_visit_status: "visited", site_visited_at: sameDay(payload.at, s), site_visit_note: text(payload.notes), workflow_status: "in_progress" };
    } else if (action === "handover") {
      requireValue(normalizedStatus(p.attendance_status) === "attended" && normalizedStatus(p.site_visit_status) === "visited" && bangkokDate(p.attended_at) === s.orientation_date && bangkokDate(p.site_visited_at) === s.orientation_date, "ต้องเข้าร่วมและ Site Visit ในวันรอบก่อนส่งมอบ");
      requireValue(guard.user.employee_id, "บัญชี HR ต้องเชื่อมกับพนักงานผู้ส่งมอบ");
      const receiver = await employee(payload.receiver_employee_id); await employee(guard.user.employee_id, true);
      requireValue(text(payload.handover_location, 300), "ระบุสถานที่ส่งมอบ");
      const position = receiver.position_id ? await plan.one("positions", receiver.position_id) : null;
      const delivery = { participant_id: p.id, receiver_employee_id: receiver.id, receiver_name_snapshot: fullName(receiver), receiver_position_snapshot: position?.position_name || "", delivered_by_employee_id: guard.user.employee_id, handover_at: sameDay(payload.at, s), handover_location: text(payload.handover_location, 300), notes: text(payload.notes) };
      const existing = await plan.read(prefix + "handovers", "participant_id", [p.id]);
      requireValue(existing.length <= 1, "พบรายการส่งมอบซ้ำ", 409);
      if (existing.length) { requireValue(reason, "แก้การส่งมอบต้องระบุเหตุผล"); before = existing[0]; plan.update(prefix + "handovers", existing[0].id, delivery); }
      else plan.insert(prefix + "handovers", delivery);
      after = delivery;
    } else if (action === "participant.close") {
      const proof = await evidence(p, s);
      requireValue(normalizedStatus(p.site_visit_status) === "visited", "ยังไม่ผ่าน Site Visit");
      const issues = completionIssues(p, s, proof.handovers, proof.photos, proof.links);
      requireValue(!issues.length, issues.join("; "));
      after = { workflow_status: "completed", completed_at: plan.now, completed_by: guard.user.id };
    } else {
      requireValue(reason && normalizedStatus(p.workflow_status) === "completed", "เปิดงานใหม่ได้เฉพาะรายการที่ปิดแล้วและต้องมีเหตุผล");
      after = { workflow_status: "in_progress", completed_at: null, completed_by: null };
    }
    if (action !== "handover") plan.update(prefix + "participants", p.id, after);
    result = { id: p.id };
  } else if (action === "session.close" || action === "session.reopen") {
    const s = await session(payload.session_id, true, action === "session.reopen"); sessionId = s.id; version(s); before = s;
    if (action === "session.close") {
      const people = await plan.read(prefix + "participants", "session_id", [s.id]);
      requireValue(people.length, "ยังไม่มีพนักงานในรอบ");
      for (const p of people) {
        const state = normalizedStatus(p.attendance_status);
        requireValue(["attended", "absent"].includes(state), "ยังมีผู้รอเช็กชื่อหรือเลื่อนรอบที่ยังไม่ได้ย้าย");
        if (state === "attended") {
          requireValue(normalizedStatus(p.workflow_status) === "completed" && normalizedStatus(p.site_visit_status) === "visited", "ยังมีผู้เข้าร่วมจริงที่ปิดงานไม่ครบ");
          const proof = await evidence(p, s);
          requireValue(!completionIssues(p, s, proof.handovers, proof.photos, proof.links).length, "หลักฐานผู้เข้าร่วมไม่ครบ");
        }
      }
      after = { status: "closed" };
    } else { requireValue(reason && normalizedStatus(s.status) === "closed", "เปิดรอบใหม่ต้องเป็นรอบที่ปิดแล้วและมีเหตุผล"); after = { status: "open" }; }
    plan.update(prefix + "sessions", s.id, after); result = { id: s.id };
  } else if (action === "photo.add") {
    requireValue(photoMetadata, "ต้องใช้ช่องทางอัปโหลดรูป");
    requireValue(PHOTO_TYPES.includes(payload.photo_type), "หมวดรูปไม่ถูกต้อง");
    requireValue(Array.isArray(photoMetadata), "ข้อมูลชุดรูปไม่ถูกต้อง");
    const countError = photoCountError(payload.photo_type, photoMetadata.length);
    requireValue(!countError, countError);
    const ids = idList(payload.participant_ids, 1, 50);
    const s = await session(payload.session_id); sessionId = s.id;
    const links = [];
    for (const id of ids) {
      const { p } = await participant(id);
      requireValue(p.session_id === s.id && normalizedStatus(p.attendance_status) === "attended", "รูปต้องผูกผู้เข้าร่วมจริงในรอบเดียวกัน");
      let handoverId = null;
      if (payload.photo_type === "site_visit") requireValue(normalizedStatus(p.site_visit_status) === "visited", "บันทึก Site Visit ก่อนผูกรูป");
      if (payload.photo_type === "handover") {
        const deliveries = await plan.read(prefix + "handovers", "participant_id", [p.id]);
        requireValue(deliveries.length === 1 && bangkokDate(deliveries[0].handover_at) === s.orientation_date, "บันทึกส่งมอบในวันรอบก่อนผูกรูป"); handoverId = deliveries[0].id;
      }
      links.push({ participant_id: p.id, handover_id: handoverId });
    }
    participantId = null;
    const photoIds = photoMetadata.map((metadata, index) => {
      let url;
      try { url = new URL(metadata.path_url); } catch { /* validated below */ }
      requireValue(url?.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash, "path_url ต้องเป็น URL เต็มแบบ HTTPS ที่ไม่หมดอายุ");
      const photo = plan.insert(prefix + "photos", { path_url: metadata.path_url, original_filename: metadata.original_filename, id: index === 0 ? requestId : randomUUID(), session_id: s.id, photo_type: payload.photo_type, taken_at: sameDay(payload.at, s), sort_order: index });
      for (const link of links) plan.insert(prefix + "photo_participants", { ...link, photo_id: photo.id });
      return photo.id;
    });
    after = { photo_ids: photoIds, participant_ids: ids, photo_type: payload.photo_type }; result = { id: photoIds[0], photo_ids: photoIds };
  }
  for (const entry of additionalHistory) plan.insert(prefix + "status_logs", {
    session_id: entry.session_id, participant_id: entry.participant_id, action,
    from_status: entry.before.workflow_status || null, to_status: entry.after.workflow_status || null,
    reason: JSON.stringify({ note: reason, request_hash: fingerprint, result, before: entry.before, after: entry.after }),
  });
  plan.insert(prefix + "status_logs", { id: requestId, session_id: sessionId, participant_id: participantId, action,
    from_status: before?.workflow_status || before?.status || before?.attendance_status || null,
    to_status: after?.workflow_status || after?.status || after?.attendance_status || null,
    reason: JSON.stringify({ note: reason, request_hash: fingerprint, result, before, after }) });
  return { plan, fingerprint, result };
}
