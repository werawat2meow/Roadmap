import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function GET() {
  try {
    const { data: requests, error: requestError } = await supabaseAdmin
      .from("leave_requests")
      .select(`
        id,
        employeeId,
        approverId,
        kind,
        startDate,
        endDate,
        session,
        reason,
        requestedDays,
        status,
        createdAt
      `)
      .ilike("reason", "[Paper]%")
      .order("createdAt", { ascending: false })
      .limit(200);

    if (requestError) throw requestError;

    const employeeIds = Array.from(
      new Set(
        (requests || [])
          .map((item: any) => item.employeeId)
          .filter(Boolean),
      ),
    );

    const { data: employees, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        department_id,
        departments(department_name)
      `)
      .in("id", employeeIds);

    if (employeeError) throw employeeError;

    const employeeById = new Map(
      (employees || []).map((emp: any) => [emp.id, emp]),
    );

    const items = (requests || []).map((item: any) => {
      const emp = employeeById.get(item.employeeId);

      return {
        id: item.id,
        employeeId: item.employeeId,
        approverId: item.approverId,
        employeeCode: emp?.employee_code || "",
        employeeName: [emp?.first_name_th, emp?.last_name_th]
          .filter(Boolean)
          .join(" "),
        department: emp?.departments?.department_name || "-",
        kind: item.kind,
        startDate: item.startDate,
        endDate: item.endDate,
        session: item.session,
        reason: item.reason,
        requestedDays: toNumber(item.requestedDays),
        status: item.status,
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error("Load HR leave entries failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "โหลดข้อมูลบันทึกวันลาไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const employeeId = String(body.employeeId || "");
    const approverId = body.approverId ? Number(body.approverId) : null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกพนักงาน" },
        { status: 400 },
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "กรุณาเพิ่มรายการลาอย่างน้อย 1 รายการ" },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (!item.kind || !item.startDate || !item.endDate) {
        return NextResponse.json(
          { success: false, error: "กรุณากรอกข้อมูลรายการลาให้ครบ" },
          { status: 400 },
        );
      }

      if (toNumber(item.requestedDays) <= 0) {
        return NextResponse.json(
          { success: false, error: "จำนวนวันลาต้องมากกว่า 0" },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();

    const rows = items.map((item: any) => {
      const note = String(item.note || "").trim();

      return {
        employeeId,
        approverId,
        kind: String(item.kind || ""),
        startDate: item.startDate,
        endDate: item.endDate,
        session: item.session || "FULL",
        requestedDays: toNumber(item.requestedDays),
        reason: `[Paper] ${note || "HR บันทึกข้อมูลจากเอกสารกระดาษ"}`,
        status: "APPROVED",
        approvedAt: now,
        hrConfirmed: true,
        hrConfirmedAt: now,
        hrConfirmedBy: "HR",
      };
    });

    const { data, error } = await supabaseAdmin
      .from("leave_requests")
      .insert(rows)
      .select("id");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Create HR leave entry failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "บันทึกวันลาไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}