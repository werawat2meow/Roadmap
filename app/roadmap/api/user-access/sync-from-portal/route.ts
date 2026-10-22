import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const ROADMAP_PERMISSION = "roadmap.portal.view";
const DEFAULT_ROLE = "ยังไม่กำหนด";

export async function POST() {
  try {
    const { data: rolePermissions, error: permissionError } =
      await supabaseAdmin
        .from("role_permissions")
        .select(
          "role_id, permissions(permission_code, is_active), roles(is_active)",
        );

    if (permissionError) {
      return NextResponse.json(
        { success: false, error: permissionError.message },
        { status: 500 },
      );
    }

    const roadmapRoleIds = new Set(
      (rolePermissions || [])
        .filter(
          (row: any) =>
            row.roles?.is_active === true &&
            row.permissions?.permission_code === ROADMAP_PERMISSION &&
            row.permissions?.is_active === true,
        )
        .map((row: any) => row.role_id),
    );

    if (roadmapRoleIds.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active Portal roles grant Roadmap access",
        },
        { status: 503 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const [
      { data: accounts, error: accountsError },
      { data: assignments, error: assignmentsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("user_accounts")
        .select("id, employee_id, role_id")
        .eq("is_active", true),
      supabaseAdmin
        .from("user_access_assignments")
        .select("user_account_id, role_id")
        .eq("status", "active")
        .lte("effective_from", today)
        .or(`effective_to.is.null,effective_to.gte.${today}`),
    ]);

    if (accountsError) {
      return NextResponse.json(
        { success: false, error: accountsError.message },
        { status: 500 },
      );
    }

    if (assignmentsError) {
      return NextResponse.json(
        { success: false, error: assignmentsError.message },
        { status: 500 },
      );
    }

    const rolesByAccount = new Map<string, Set<string>>();

    for (const account of accounts || []) {
      rolesByAccount.set(
        account.id,
        new Set(account.role_id ? [account.role_id] : []),
      );
    }

    for (const assignment of assignments || []) {
      const roles = rolesByAccount.get(assignment.user_account_id);

      if (roles && assignment.role_id) {
        roles.add(assignment.role_id);
      }
    }

    const eligibleAccounts = (accounts || []).filter((account: any) => {
      const roles = rolesByAccount.get(account.id) || new Set<string>();

      return [...roles].some((roleId) => roadmapRoleIds.has(roleId));
    });

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("rm_user_access")
      .select("id, user_account_id, employee_id");

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 },
      );
    }

    const existingByAccount = new Map<string, any>();
    const existingByEmployee = new Map<string, any>();

    for (const row of existingRows || []) {
      if (row.user_account_id) {
        existingByAccount.set(row.user_account_id, row);
      }
      if (row.employee_id) {
        existingByEmployee.set(row.employee_id, row);
      }
    }

    const inserts = [];
    const updates = [];

    for (const account of eligibleAccounts) {
      const existing =
        existingByAccount.get(account.id) ||
        (account.employee_id
          ? existingByEmployee.get(account.employee_id)
          : undefined);

      if (existing) {
        updates.push(
          supabaseAdmin
            .from("rm_user_access")
            .update({
              user_account_id: account.id,
              employee_id: account.employee_id || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id),
        );
      } else {
        inserts.push({
          user_account_id: account.id,
          employee_id: account.employee_id || null,
          role: DEFAULT_ROLE,
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("rm_user_access")
        .insert(inserts);

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 },
        );
      }
    }

    if (updates.length > 0) {
      const results = await Promise.all(updates);
      const updateError = results.find((result) => result.error)?.error;

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      synced: eligibleAccounts.length,
      inserted: inserts.length,
      updated: updates.length,
      removed: 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "sync failed" },
      { status: 500 },
    );
  }
}
