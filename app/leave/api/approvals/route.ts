import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function getEmployeeName(emp: any) {
  return [emp.first_name_th, emp.last_name_th].filter(Boolean).join(" ");
}

function normalizeEmployee(
  emp: any,
  approverByEmployeeId: Map<string, any>,
  approverIdsByEmployeeId: Map<string, number[]>,
) {
  const approver = approverByEmployeeId.get(emp.id);

  return {
    id: emp.id,
    employeeCode: emp.employee_code,
    approverId: approver?.id ?? null,
    name: getEmployeeName(emp),
    email: emp.work_email || emp.email || "",
    dept: emp.departments?.department_name || "-",
    division: emp.divisions?.division_name || "",
    unit: emp.units?.unit_name || "",
    level: emp.position_levels?.level_code
      ? `Level ${emp.position_levels.level_code}`
      : emp.position_levels?.level_name || "-",
    firstNameTh: emp.first_name_th,
    lastNameTh: emp.last_name_th,
    firstNameEn: emp.first_name_en,
    lastNameEn: emp.last_name_en,
    citizenId: emp.citizen_id,
    departmentId: emp.department_id,
    divisionId: emp.division_id,
    unitId: emp.unit_id,
    has_approval_authority: approverByEmployeeId.has(emp.id),
    approver_ids: approverIdsByEmployeeId.get(emp.id) || [],
  };
}

export async function GET() {
  try {
    const [employeesRes, approversRes, employeeApproversRes, configsRes] =
      await Promise.all([
        supabaseAdmin
          .from("employees")
          .select(
            `
        id,
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        email,
        work_email,
        citizen_id,
        department_id,
        division_id,
        unit_id,
        position_level_id,
        is_deleted,
        status,
        departments(department_name),
        divisions(division_name),
        units(unit_name),
        position_levels(level_name, level_code)
      `,
          )
          .eq("is_deleted", false)
          .eq("status", "active")
          .order("employee_code", { ascending: true }),

        supabaseAdmin.from("leave_approvers").select("*"),

        supabaseAdmin
          .from("leave_employee_approvers")
          .select("employeeId, approverId"),

        supabaseAdmin
          .from("leave_employee_configs")
          .select("employeeId, weeklyHoliday, work_start_time, work_end_time"),
      ]);

    if (employeesRes.error) throw employeesRes.error;
    if (approversRes.error) throw approversRes.error;
    if (employeeApproversRes.error) throw employeeApproversRes.error;
    if (configsRes.error) throw configsRes.error;

    const approvers = approversRes.data || [];
    const employeeApprovers = employeeApproversRes.data || [];

    const configs = configsRes.data || [];

    const configByEmployeeId = new Map(
      configs.map((item: any) => [item.employeeId, item]),
    );

    const approverByEmployeeId = new Map(
      approvers.map((item: any) => [item.employeeId, item]),
    );

    const approverIdsByEmployeeId = new Map<string, number[]>();

    employeeApprovers.forEach((item: any) => {
      const current = approverIdsByEmployeeId.get(item.employeeId) || [];
      approverIdsByEmployeeId.set(item.employeeId, [
        ...current,
        item.approverId,
      ]);
    });

    const employees = (employeesRes.data || []).map((emp: any) => {
      const normalized = normalizeEmployee(
        emp,
        approverByEmployeeId,
        approverIdsByEmployeeId,
      );

      const config = configByEmployeeId.get(emp.id);

      return {
        ...normalized,
        weeklyHoliday: config?.weeklyHoliday || "",
        workStartTime: config?.work_start_time || "",
        workEndTime: config?.work_end_time || "",
      };
    });

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error: any) {
    console.error("Load leave approvals failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "โหลดข้อมูลผู้อนุมัติไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "toggle-authority") {
      const { employee, enabled } = body;

      if (!employee?.id) {
        return NextResponse.json(
          { success: false, error: "Missing employee" },
          { status: 400 },
        );
      }

      if (enabled) {
        const payload = {
          employeeId: employee.id,
          empNo: employee.employeeCode,
          firstNameTh: employee.firstNameTh || employee.name || "-",
          lastNameTh: employee.lastNameTh || "-",
          firstNameEn: employee.firstNameEn || null,
          lastNameEn: employee.lastNameEn || null,
          citizenId: employee.citizenId || null,
          email: employee.email || null,
          branchId: null,
          departmentId: employee.departmentId || null,
          divisionId: employee.divisionId || null,
          unitId: employee.unitId || null,
          updatedAt: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from("leave_approvers")
          .upsert(payload, { onConflict: "employeeId" });

        if (error) throw error;
      } else {
        const { data: approver } = await supabaseAdmin
          .from("leave_approvers")
          .select("id")
          .eq("employeeId", employee.id)
          .maybeSingle();

        if (approver?.id) {
          await supabaseAdmin
            .from("leave_employee_approvers")
            .delete()
            .eq("approverId", approver.id);
        }

        const { error } = await supabaseAdmin
          .from("leave_approvers")
          .delete()
          .eq("employeeId", employee.id);

        if (error) throw error;
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "update-approvers") {
      const employeeId = body.employeeId as string;
      const approverIds = (body.approverIds || []) as number[];

      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: "Missing employee id" },
          { status: 400 },
        );
      }

      const deleteRes = await supabaseAdmin
        .from("leave_employee_approvers")
        .delete()
        .eq("employeeId", employeeId);

      if (deleteRes.error) throw deleteRes.error;

      if (approverIds.length > 0) {
        const rows = approverIds.map((approverId) => ({
          employeeId,
          approverId,
        }));

        const insertRes = await supabaseAdmin
          .from("leave_employee_approvers")
          .insert(rows);

        if (insertRes.error) throw insertRes.error;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Update leave approvals failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "บันทึกข้อมูลผู้อนุมัติไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}
