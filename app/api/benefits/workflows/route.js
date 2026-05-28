import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-key"
  );

  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      role_id,
      username,
      is_active,
      roles (
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (!data || !data.is_active) return null;

  let permissions = [];

  if (data.role_id) {
    const { data: permissionRows } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permissions (
          permission_code,
          is_active
        )
      `)
      .eq("role_id", data.role_id);

    permissions =
      permissionRows
        ?.map((row) => row.permissions)
        ?.filter((perm) => perm?.is_active)
        ?.map((perm) => perm.permission_code) || [];
  }

  return {
    ...data,
    permissions,
  };
}

function hasPermission(user, permission) {
  if (user?.roles?.role_code === "SUPER_ADMIN") {
    return true;
  }

  return user?.permissions?.includes(permission);
}

export async function GET(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !hasPermission(user, "benefit.workflow.view") &&
      !hasPermission(user, "benefit.workflow.manage")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มีสิทธิ์ดู Workflow",
        },
        {
          status: 403,
        }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 10), 1),
      100
    );

    const benefitId =
      searchParams.get("benefitId") || "";

    const isActive =
      searchParams.get("isActive") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("benefit_approval_workflows")
      .select(
        `
        id,
        benefit_id,
        workflow_name,
        step_no,
        approver_role_code,
        approver_user_id,
        is_required,
        is_active,
        created_at,
        updated_at,
        benefits (
          id,
          benefit_code,
          benefit_name
        ),
        user_accounts (
          id,
          username
        )
      `,
        {
          count: "exact",
        }
      );

    if (benefitId) {
      query = query.eq("benefit_id", benefitId);
    }

    if (isActive !== "") {
      query = query.eq(
        "is_active",
        isActive === "true"
      );
    }

    const { data, error, count } = await query
      .order("workflow_name", {
        ascending: true,
      })
      .order("step_no", {
        ascending: true,
      })
      .range(from, to);

    if (error) {
      console.error(
        "BENEFIT_WORKFLOW_GET_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error(
      "BENEFIT_WORKFLOW_FATAL_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "โหลด Workflow ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !hasPermission(user, "benefit.workflow.create") &&
      !hasPermission(user, "benefit.workflow.manage")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มีสิทธิ์สร้าง Workflow",
        },
        {
          status: 403,
        }
      );
    }

    const body = await req.json();

    const benefit_id =
      body?.benefit_id || null;

    const workflow_name =
      body?.workflow_name?.trim() || "";

    const step_no = Number(body?.step_no);

    const approver_role_code =
      body?.approver_role_code?.trim() || null;

    const approver_user_id =
      body?.approver_user_id || null;

    const is_required =
      body?.is_required !== false;

    const is_active =
      body?.is_active !== false;

    if (!benefit_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Benefit",
        },
        {
          status: 400,
        }
      );
    }

    if (!workflow_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Workflow Name",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(step_no) ||
      step_no <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Step No ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_approval_workflows")
      .insert({
        benefit_id,
        workflow_name,
        step_no,
        approver_role_code,
        approver_user_id,
        is_required,
        is_active,
      })
      .select(`
        id,
        benefit_id,
        workflow_name,
        step_no,
        approver_role_code,
        approver_user_id,
        is_required,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error(
        "BENEFIT_WORKFLOW_POST_ERROR:",
        error
      );

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Step นี้ถูกใช้งานแล้ว",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "BENEFIT_WORKFLOW_POST_FATAL:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "สร้าง Workflow ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}