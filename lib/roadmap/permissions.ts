import { supabaseAdmin } from "@/lib/supabaseServer";

export async function requireRoadmapPermission(
  employeeId: string,
  menuName: string,
): Promise<boolean> {
  if (!employeeId || !menuName) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("rm_user_access")
    .select(`
      id,
      employee_id,
      rm_user_menu_permissions (
        menu_name,
        is_allowed
      )
    `)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return Boolean(
    data.rm_user_menu_permissions?.some(
      (permission: {
        menu_name: string;
        is_allowed: boolean;
      }) =>
        permission.menu_name === menuName &&
        permission.is_allowed === true,
    ),
  );
}