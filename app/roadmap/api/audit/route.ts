import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeRoadmapAuditLog } from "@/lib/roadmap/auditLog";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: "Missing action" },
        { status: 400 },
      );
    }

    await writeRoadmapAuditLog({
      userId: auth.user.id,
      employeeId: auth.user.employee_id ?? null,
      page: body.page ?? null,
      action: body.action,
      targetType: body.targetType ?? null,
      targetId: body.targetId ?? null,
      description: body.description ?? null,
      metadata: body.metadata ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Audit failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_code, role_name")
      .eq("id", auth.user.role_id)
      .maybeSingle();

    if (roleError) {
      return NextResponse.json(
        { success: false, error: roleError.message },
        { status: 500 },
      );
    }

    if (roleData?.role_code !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Super Admin only" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(url.searchParams.get("pageSize") || 20), 1),
      100,
    );

    let query = supabaseAdmin
      .from("rm_audit_logs")
      .select("*", { count: "exact" })
      .eq("module", "roadmap")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `page.ilike.%${search}%,action.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const userIds = [
      ...new Set(
        (data || [])
          .map((item: any) => item.user_id)
          .filter(Boolean),
      ),
    ];

    const employeeIds = [
      ...new Set(
        (data || [])
          .map((item: any) => item.employee_id)
          .filter(Boolean),
      ),
    ];

    const userEmployeeMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: accounts, error: accountError } = await supabaseAdmin
        .from("user_accounts")
        .select("id, employee_id")
        .in("id", userIds);

      if (accountError) {
        return NextResponse.json(
          { success: false, error: accountError.message },
          { status: 500 },
        );
      }

      for (const account of accounts || []) {
        if (account.employee_id) {
          userEmployeeMap.set(account.id, account.employee_id);
          employeeIds.push(account.employee_id);
        }
      }
    }

    const uniqueEmployeeIds = [...new Set(employeeIds)];

    const employeeMap = new Map<
      string,
      {
        code: string;
        name: string;
      }
    >();

    if (uniqueEmployeeIds.length > 0) {
      const { data: employees, error: employeeError } = await supabaseAdmin
        .from("employees")
        .select("id, employee_code, first_name_th, last_name_th")
        .in("id", uniqueEmployeeIds);

      if (employeeError) {
        return NextResponse.json(
          { success: false, error: employeeError.message },
          { status: 500 },
        );
      }

      for (const employee of employees || []) {
        employeeMap.set(employee.id, {
          code: employee.employee_code || "",
          name: `${employee.first_name_th || ""} ${
            employee.last_name_th || ""
          }`.trim(),
        });
      }
    }

    const mappedData = (data || []).map((item: any) => {
      const employeeId =
        item.employee_id ||
        (item.user_id ? userEmployeeMap.get(item.user_id) : null);

      const employee = employeeId
        ? employeeMap.get(employeeId)
        : null;

      return {
        ...item,
        employee_id: employeeId,
        employee_code: employee?.code || null,
        employee_name: employee?.name || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load audit logs",
      },
      { status: 500 },
    );
  }
}