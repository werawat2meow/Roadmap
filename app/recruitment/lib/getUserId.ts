import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserAccessContext } from "@/lib/auth/getUserAccessContext";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";


export async function getUserIdFromRequest(): Promise<number | string | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    ) as jwt.JwtPayload;

    return decoded?.user_id ?? null;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      return null;
    }

    return jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    ) as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
}


export async function getUserAccess() {

  try {

    const auth = await getAuthenticatedUser();

    const get_access = await getUserAccessContext( auth.user.id );

    if (!get_access) { return null; }

    let branches = [];

    /**
     * 1. มีสิทธิ์ทั้งหมด
     * ดึง branches ทั้งหมด
     */
    if (get_access.has_all_scope === true) {
      const { data, error } = await supabaseAdmin
        .from("branches")
        .select("*");

      if (error) {
        console.error("Get all branches error:", error);
        return null;
      }

      branches = data ?? [];
    }

    /**
     * 2. มี allowed_branch_ids
     */
    else if (
      Array.isArray(get_access.allowed_branch_ids) &&
      get_access.allowed_branch_ids.length > 0
    ) {
      const { data, error } = await supabaseAdmin
        .from("branches")
        .select("*")
        .in("id", get_access.allowed_branch_ids);

      if (error) {
        console.error("Get branches by branch_ids error:", error);
        return null;
      }

      branches = data ?? [];
    }

    /**
     * 3. มี allowed_branch_group_ids
     */
    else if (
      Array.isArray(get_access.allowed_branch_group_ids) &&
      get_access.allowed_branch_group_ids.length > 0
    ) {
      const { data, error } = await supabaseAdmin
        .from("branches")
        .select("*")
        .in(
          "group_id",
          get_access.allowed_branch_group_ids
        );

      if (error) {
        console.error("Get branches by group_ids error:", error);
        return null;
      }

      branches = data ?? [];
    }

    /**
     * 4. มี allowed_company_ids
     */
    else if (
      Array.isArray(get_access.allowed_company_ids) &&
      get_access.allowed_company_ids.length > 0
    ) {
      const { data, error } = await supabaseAdmin
        .from("branches")
        .select("*")
        .in(
          "company_id",
          get_access.allowed_company_ids
        );

      if (error) {
        console.error("Get branches by company_ids error:", error);
        return null;
      }

      branches = data ?? [];
    }

    /**
     * 5. ไม่มี scope ใดเลย
     */
    else {
      return null;
    }

    /**
     * map branches
     */
    const branchArray = branches.map((branch) => ({
      id: branch.id,
      name: branch.branch_name,
      group_id: branch.group_id,
      company_id: branch.company_id,
    }));

    return { branchArray , all_scrop:get_access.has_all_scope };
  } catch (error) {
    console.error("getUserAccess error:", error);
    return null;
  }
}