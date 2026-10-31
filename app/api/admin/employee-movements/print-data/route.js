import { NextResponse } from "next/server";
import { db, gate, safeError, authorizedEmployee } from "@/lib/employeeMovements";
import { roster } from "@/lib/employeeMovementRoster";

export async function GET(req) {
  try {
    const access = await gate(req);
    if (access.response) return access.response;
    const params = new URL(req.url).searchParams;
    const ids = [...new Set((params.get("ids") || "").split(",").map(s => s.trim()).filter(Boolean))];
    if (!ids.length || ids.length > 100) return NextResponse.json({ success: false, error: "เลือกได้ 1–100 รายการต่อครั้ง" }, { status: 400 });
    for (const id of ids) if (!(await authorizedEmployee(access.guard, id))) return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์เข้าถึงข้อมูลบางรายการ" }, { status: 403 });

    const { rows } = await roster(access.guard, new URLSearchParams());
    const records = rows.filter(r => ids.includes(r.id));
    if (records.length !== ids.length) return NextResponse.json({ success: false, error: "ไม่พบรายการทั้งหมดใน Scope" }, { status: 403 });
    const reportType = params.get("type") === "exit" ? "exit" : "orientation";
    if (reportType === "exit" && records.some(r => !["RESIGNED", "RETIRED", "TERMINATED"].includes(String(r.status_code || "").toUpperCase()) && r.event !== "EXITED")) return NextResponse.json({ success: false, error: "รายงานพ้นสภาพใช้ได้เฉพาะพนักงานที่พ้นสภาพแล้ว" }, { status: 400 });
    if (reportType === "orientation" && records.some(r => r.orientation_status !== "COMPLETED")) return NextResponse.json({ success: false, error: "ต้องยืนยัน Orientation เสร็จแล้วก่อนจึงจะส่งออกรายงานได้" }, { status: 400 });

    // Read only authorized employee IDs. Do not expose salary or sensitive ID numbers.
    const { data: people, error: peopleError } = await db.from("employees")
      .select("id,employee_photo_url,first_name_th,last_name_th,nickname_th,phone,hire_date,start_work_date,branch_id,department_id,position_id,position_level_id")
      .in("id", ids);
    if (peopleError) throw peopleError;
    const personMap = new Map((people || []).map(r => [r.id, r]));

    const branchIds = [
      ...new Set(
        records
          .map(r =>
            personMap.get(r.id)?.branch_id ||
            r.branch_id
          )
          .filter(Boolean)
      )
    ];
    const branchMap = new Map();
    if (branchIds.length) {
      const { data, error } = await db.from("branches").select("id,branch_code,branch_name,branch_image_url").in("id", branchIds);
      if (error) throw error;
      for (const r of data || []) branchMap.set(r.id, r);
    }
    const positionIds = [...new Set((people || []).map(r => r.position_id).filter(Boolean))];
    const positionMap = new Map();
    if (positionIds.length) {
      const { data, error } = await db.from("positions").select("id,position_name").in("id", positionIds);
      if (error) throw error;
      for (const r of data || []) positionMap.set(r.id, r.position_name);
    }
    const levelIds = [...new Set((people || []).map(r => r.position_level_id).filter(Boolean))];
    const levelMap = new Map();
    if (levelIds.length) {
      const { data, error } = await db.from("position_levels").select("id,level_code,level_name").in("id", levelIds);
      if (error) throw error;
      for (const r of data || []) levelMap.set(r.id, r);
    }

    const output = records.map(r => {
      const person = personMap.get(r.id) || {};
      const branch = branchMap.get(r.branch_id) || {};
      const level = levelMap.get(person.position_level_id) || {};
      return {
        id: r.id,
        employee_code: r.employee_code,
        name: [person.first_name_th || r.first_name_th, person.last_name_th || r.last_name_th].filter(Boolean).join(" "),
        nickname: person.nickname_th || "",
        phone: person.phone || "",
        hire_date: person.hire_date || person.start_work_date || r.hire_date,
        orientation_date: r.orientation_date || r.hire_date,
        orientation_location: r.orientation_location || "",
        orientation_status: r.orientation_status,
        event: r.event,
        report_type: reportType,
        employee_status: r.status_name,
        exit_date: r.resignation_date,
        branch_id: r.branch_id,
        branch_code: branch.branch_code || "",
        branch_name: branch.branch_name || r.organization?.branch_id || "",
        branch_image_url: branch.branch_image_url || null,
        department: r.organization?.department_id || "",
        position_name: positionMap.get(person.position_id) || "",
        level_code: level.level_code || "",
        photo_url: person.employee_photo_url || null,
      };
    });
    return NextResponse.json({ success: true, data: output });
  } catch (e) { return safeError(e); }
}
/////