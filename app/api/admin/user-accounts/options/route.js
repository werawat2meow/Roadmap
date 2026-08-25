import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_ACTIONS = new Set([
  "view",
  "create",
  "edit",
]);

function jsonError(error, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

function normalizeAction(value) {
  const action = String(
    value || "view"
  ).trim();

  return ALLOWED_ACTIONS.has(action)
    ? action
    : "view";
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const type = String(
      searchParams.get("type") || "employees"
    ).trim();

    const action = normalizeAction(
      searchParams.get("action")
    );

    const search = String(
      searchParams.get("search") || ""
    ).trim();

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get("pageSize") || 20
        ),
        1
      ),
      100
    );

    const guard = await requireScopedAccess(
      "access.user_accounts",
      action,
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    if (type === "roles") {
      let query = supabaseAdmin
        .from("roles")
        .select(
          "id, role_code, role_name, is_active, is_system",
          { count: "exact" }
        )
        .eq("is_active", true)
        .order("role_code", {
          ascending: true,
        });

      if (search) {
        query = query.or(
          `role_code.ilike.%${search}%,role_name.ilike.%${search}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const {
        data,
        error,
        count,
      } = await query.range(from, to);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: (data || []).map((item) => ({
          value: item.id,
          label: `${item.role_code} - ${item.role_name}`,
          role_code: item.role_code,
          role_name: item.role_name,
          is_system:
            item.is_system ?? false,
        })),
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.max(
            Math.ceil(
              (count || 0) / pageSize
            ),
            1
          ),
        },
      });
    }

    if (type !== "employees") {
      return jsonError(
        "ประเภท Option ไม่ถูกต้อง",
        400
      );
    }

    let query = supabaseAdmin
      .from("employees")
      .select(
        `
          id,
          employee_code,
          first_name_th,
          last_name_th,
          branch_group_id,
          branch_id,
          department_id,
          division_id,
          unit_id,
          status
        `,
        { count: "exact" }
      )
      .order("employee_code", {
        ascending: true,
      });

    query = guard.applyEmployeeScope(query);

    if (search) {
      query = query.or(
        `employee_code.ilike.%${search}%,first_name_th.ilike.%${search}%,last_name_th.ilike.%${search}%`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(from, to);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((item) => {
        const name = `${
          item.first_name_th || ""
        } ${
          item.last_name_th || ""
        }`.trim();

        return {
          value: item.id,
          label: `${
            item.employee_code || "-"
          } - ${name || "-"}`,
          employee_code:
            item.employee_code || "-",
          employee_name: name || "-",
        };
      }),
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.max(
          Math.ceil(
            (count || 0) / pageSize
          ),
          1
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET_USER_ACCOUNT_OPTIONS_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดตัวเลือกผู้ใช้งานได้"
    );
  }
}
