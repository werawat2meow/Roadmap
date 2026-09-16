import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { createNotification } from "@/lib/notifications/createNotification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body;

    if (
      type !== "REQUEST_NOMINATION" &&
      type !== "REQUEST_MANAGER_EVALUATION"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid notification type" },
        { status: 400 },
      );
    }
    if (type === "REQUEST_MANAGER_EVALUATION") {
      const { data: reviewerRows, error: reviewerError } = await supabaseAdmin
        .from("rm_evaluation_reviewers")
        .select("manager_id, rm_evaluations!inner(id, employee_id, status)")
        .in("rm_evaluations.status", ["Draft", "In_Review"]);

      if (reviewerError) throw reviewerError;

      const managerEmployeeIds = [
        ...new Set(
          (reviewerRows || [])
            .map((row: any) => row.manager_id)
            .filter(Boolean),
        ),
      ];

      if (managerEmployeeIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "ไม่พบหัวหน้าที่ต้องลงคะแนนในรอบนี้",
          },
          { status: 400 },
        );
      }

      const { data: accounts, error: accountError } = await supabaseAdmin
        .from("user_accounts")
        .select("id, employee_id")
        .in("employee_id", managerEmployeeIds);

      if (accountError) throw accountError;

      let sentCount = 0;

      for (const account of accounts || []) {
        await createNotification({
          user_account_id: account.id,
          notification_type: "roadmap_manager_evaluation_request",
          title: "ฟอร์มประเมินพร้อมลงคะแนนแล้ว",
          message:
            "HR ได้จัดเตรียมฟอร์มประเมินเรียบร้อยแล้ว กรุณาเข้ามาลงคะแนนและส่งผลภายในวันที่ 7",
          module_code: "roadmap",
          action_url: "/roadmap/evaluatemgr",
          priority: "warning",
        });

        sentCount++;
      }

      return NextResponse.json({
        success: true,
        message: `ส่งแจ้งเตือนให้หัวหน้าลงคะแนนเรียบร้อยแล้ว (${sentCount} คน)`,
      });
    }

    // 1. ดึงเฉพาะคนที่มี role = "Manager" ใน rm_user_access (ไม่เอา Admin หรือ "ยังไม่กำหนด")
    const { data: managersAccess, error: uaError } = await supabaseAdmin
      .from("rm_user_access")
      .select("employee_id, role")
      .eq("role", "Manager");

    if (uaError) throw uaError;

    const managerEmployeeIds = (managersAccess || [])
      .map((u) => u.employee_id)
      .filter(Boolean);

    if (managerEmployeeIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบผู้ใช้ที่มีสิทธิ์ Manager ในระบบ (กรุณาตรวจสอบที่เมนู Settings)",
        },
        { status: 400 },
      );
    }

    // 2. หา user_account_id ของ Manager เพื่อยิง Notification
    const { data: accounts, error: accError } = await supabaseAdmin
      .from("user_accounts")
      .select("id, employee_id")
      .in("employee_id", managerEmployeeIds);

    if (accError) throw accError;

    const title = "📢 แจ้งเตือน: เสนอชื่อพนักงานเข้าแผนรอบประเมินเดือนหน้า";
    const message =
      "กรุณาตรวจสอบและส่งรายชื่อพนักงานที่จะเข้าแผน Promote / Performance / Progression ภายในวันที่ 28 (ไม่เกี่ยวกับ Probation)";

    // 3. ส่ง Notification หาหัวหน้าทุกคน
    let sentCount = 0;
    for (const acc of accounts || []) {
      await createNotification({
        user_account_id: acc.id,
        notification_type: "roadmap_cycle_nomination_request",
        title,
        message,
        module_code: "roadmap",
        action_url: "/roadmap/evaluatemgr",
        priority: "warning",
      });
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `ส่งแจ้งเตือนไปยังหัวหน้างาน (Manager) เรียบร้อยแล้ว (${sentCount} ท่าน)`,
    });
  } catch (error: any) {
    console.error("Broadcast nomination alert error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
