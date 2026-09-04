import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const ROADMAP_PERMISSION = "roadmap.portal.view";

export async function POST() {
  try {
    // 1) หารายการ role ที่แมปกับ permission ของ roadmap
    const { data: rolePermsRaw, error: rpError } = await supabaseAdmin
      .from("role_permissions")
      .select("role_id, permissions(permission_code)");

    if (rpError) {
      return NextResponse.json({ success: false, error: rpError.message }, { status: 500 });
    }

    const allowedRoleIds = new Set<string>(
      (rolePermsRaw || [])
        .filter((r: any) => r.permissions?.permission_code === ROADMAP_PERMISSION)
        .map((r: any) => r.role_id)
    );

    if (allowedRoleIds.size === 0) {
      // ไม่มี role ใดให้สิทธิ์ roadmap -> ทำการลบ rm_user_access ทั้งหมดเพื่อความสะอาด (ถ้าต้องการเก็บไว้ เปลี่ยนเป็น skip)
      const { error: delAllErr } = await supabaseAdmin.from("rm_user_access").delete().neq("id", ""); // delete all rows
      if (delAllErr) {
        return NextResponse.json({ success: false, error: delAllErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, synced: 0, inserted: 0, removed: "all" });
    }

    // 2) ดึง users จาก user_accounts ที่มี role_id และ employee_id
    const { data: uaData, error: uaErr } = await supabaseAdmin
      .from("user_accounts")
      .select("id, employee_id, role_id")
      .not("employee_id", "is", null);

    if (uaErr) {
      return NextResponse.json({ success: false, error: uaErr.message }, { status: 500 });
    }

    // 3) ดึง user_role_assignments (multi-role) เพื่อรวม role เพิ่มเติม
    const { data: uraData, error: uraErr } = await supabaseAdmin
      .from("user_role_assignments")
      .select("user_account_id, role_id");

    if (uraErr) {
      return NextResponse.json({ success: false, error: uraErr.message }, { status: 500 });
    }

    // สร้าง map: user_account_id -> Set(role_id)
    const userRoleMap = new Map<string, Set<string>>();

    (uaData || []).forEach((u: any) => {
      if (!u.employee_id) return;
      userRoleMap.set(u.id, new Set([u.role_id].filter(Boolean)));
    });

    (uraData || []).forEach((r: any) => {
      if (!userRoleMap.has(r.user_account_id)) {
        userRoleMap.set(r.user_account_id, new Set());
      }
      if (r.role_id) userRoleMap.get(r.user_account_id)!.add(r.role_id);
    });

    // จับเฉพาะ user ที่มี employee_id และมี role ที่อนุญาต
    const employeeIdsToSync = new Set<string>();
    (uaData || []).forEach((u: any) => {
      if (!u.employee_id) return;
      const roles = userRoleMap.get(u.id) || new Set();
      for (const rid of roles) {
        if (allowedRoleIds.has(rid)) {
          employeeIdsToSync.add(u.employee_id);
          break;
        }
      }
    });

    const employeeIds = Array.from(employeeIdsToSync);

    // 4) หา existing rm_user_access rows
    const { data: existingRows, error: existingErr } = await supabaseAdmin
      .from("rm_user_access")
      .select("id, employee_id");

    if (existingErr) {
      return NextResponse.json({ success: false, error: existingErr.message }, { status: 500 });
    }

    const existingByEmployee = new Map<string, string>();
    (existingRows || []).forEach((r: any) => {
      if (r.employee_id) existingByEmployee.set(r.employee_id, r.id);
    });

    // 5) Prepare inserts for employees not existing
    const inserts = employeeIds
      .filter(eid => !existingByEmployee.has(eid))
      .map(eid => ({ employee_id: eid, role: "ยังไม่กำหนด" }));

    if (inserts.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from("rm_user_access").insert(inserts);
      if (insertErr) {
        return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
      }
    }

    // 6) Remove rm_user_access entries for employees that no longer have permission
    const existingEmployeeIds = Array.from(existingByEmployee.keys());
    const toRemove = existingEmployeeIds.filter(eid => !employeeIdsToSync.has(eid));
    let removedCount = 0;
    if (toRemove.length > 0) {
      const { error: deleteErr } = await supabaseAdmin.from("rm_user_access").delete().in("employee_id", toRemove);
      if (deleteErr) {
        return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 });
      }
      removedCount = toRemove.length;
    }

    return NextResponse.json({
      success: true,
      synced: employeeIds.length,
      inserted: inserts.length,
      removed: removedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "sync failed" }, { status: 500 });
  }
}