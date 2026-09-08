import { createClient } from "@supabase/supabase-js";

/** Supabase admin client — ใช้ query ตาราง employees, user_accounts, departments ฯลฯ จาก team DB */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type SupabaseEmployee = {
  id: string;
  employee_code: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  email: string | null;
  hire_date: string | null;
  employee_photo_url: string | null;
  branch_id: string | null;
  department_id: string | null;
  division_id: string | null;
  unit_id: string | null;
  position_id: string | null;
  branches: { branch_name: string } | null;
  departments: { department_name: string } | null;
  divisions: { division_name: string } | null;
  units: { unit_name: string } | null;
  positions: { position_name: string; position_level: string | null } | null;
};

/** ดึงข้อมูลพนักงานจาก Supabase ด้วย UUID */
export async function getEmployeeByUuid(uuid: string): Promise<SupabaseEmployee | null> {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(
      `id, employee_code, first_name_th, last_name_th, email, hire_date,
       employee_photo_url, branch_id, department_id, division_id, unit_id, position_id,
       branches(branch_name), departments(department_name), divisions(division_name),
       units(unit_name), positions(position_name, position_level)`
    )
    .eq("id", uuid)
    .maybeSingle();

  if (error) {
    console.error("getEmployeeByUuid error:", error);
    return null;
  }
  return (data as unknown as SupabaseEmployee) ?? null;
}
