import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";

const DEFAULT_ROADMAP_MENUS = [
  "Overview",
  "Employee",
  "Evaluate HR",
];

const ALL_ROADMAP_MENUS = [
  ...DEFAULT_ROADMAP_MENUS,
  "Evaluate MGR",
  "Management",
  "Reports",
  "Send Account",
  "Settings",
  "Audit Logs",
];

export async function getCurrentRoadmapAccess() {
  const auth = await requirePermission("roadmap.portal.view");

  if (!auth.ok) {
    return {
      ok: false as const,
      response: auth.response,
    };
  }

  const employeeId = auth.user.employee_id;
  const isSuperAdmin = Boolean(auth.access?.is_super_admin);

  if (isSuperAdmin) {
    return {
      ok: true as const,
      employeeId,
      isSuperAdmin: true,
      menus: ALL_ROADMAP_MENUS,
    };
  }

  // ได้รับสามเมนูพื้นฐาน แม้ยังไม่มีแถว rm_user_access
  if (!employeeId) {
    return {
      ok: true as const,
      employeeId: null,
      isSuperAdmin: false,
      menus: [...DEFAULT_ROADMAP_MENUS],
    };
  }

  const { data, error } = await supabaseAdmin
    .from("rm_user_access")
    .select(`
      id,
      rm_user_menu_permissions (
        menu_name,
        is_allowed
      )
    `)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const additionalMenus = (
    data?.rm_user_menu_permissions || []
  )
    .filter((permission) => permission.is_allowed === true)
    .map((permission) => permission.menu_name)
    .filter((menu) => menu !== "Audit Logs");

  return {
    ok: true as const,
    employeeId,
    isSuperAdmin: false,
    menus: Array.from(
      new Set([
        ...DEFAULT_ROADMAP_MENUS,
        ...additionalMenus,
      ]),
    ),
  };
}

// คงชื่อฟังก์ชันเดิม เพื่อให้ API ที่เรียกใช้อยู่ทำงานต่อได้
export async function requireRoadmapPermission(
  employeeId: string,
  menuName: string,
): Promise<boolean> {
  if (!employeeId || !menuName) return false;

  const access = await getCurrentRoadmapAccess();

  if (!access.ok) return false;

  // ห้ามใช้รหัสพนักงานคนอื่นใน request เพื่อขอผ่านสิทธิ์
  if (access.employeeId !== employeeId) return false;

  return access.menus.includes(menuName);
}