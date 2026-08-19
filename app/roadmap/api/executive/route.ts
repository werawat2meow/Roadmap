import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// ฟังก์ชันคำนวณเกรดตามเกณฑ์ที่คุณกำหนด
const getGrade = (percent: number) => {
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
};

export async function GET() {
  try {
    // 1. ดึงข้อมูลการประเมิน
    const { data: evaluations, error: evalError } = await supabaseAdmin
      .from("rm_evaluations")
      .select(`
        id,
        employee_id,
        evaluator_id,
        approved_by,
        approved_at,
        rejected_by,
        rejected_at,
        rejection_note,
        status,
        totalScore,
        maxScore,
        grade,
        newLevel,
        completedAt,
        created_at,
        rm_evaluation_types(name)
      `)
      .eq("status", "Submitted");

    if (evalError) throw evalError;
    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json({
        stats: { completed: 0, deptCount: 0, avgScore: 0, topName: "-" },
        employees: [],
      });
    }

    const userIds = [
      ...new Set([
        ...evaluations.map((r: any) => r.employee_id),
        ...evaluations.map((r: any) => r.evaluator_id),
      ]),
    ].filter(Boolean);

    // 2. ดึงข้อมูลพนักงาน
    const { data: employeeRows, error: empError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        department_id,
        departments(department_name),
        positions(
          position_name,
          position_level_mappings(
            is_default,
            position_levels(level_code, level_name)
          )
        )
      `)
      .in("id", userIds);

    if (empError) throw empError;
    const empMap = new Map(employeeRows?.map((emp: any) => [emp.id, emp]));

    // 3. ดึงข้อมูลผู้อนุมัติ / ผู้ปฏิเสธ เพื่อแปลงเป็นชื่อ
    const approverIds = [
      ...new Set(
        evaluations
          .flatMap((item: any) => [item.approved_by, item.rejected_by])
          .filter(Boolean)
      ),
    ];

    const approverNameByUserId = new Map<string, string>();

    if (approverIds.length > 0) {
      const { data: approverUsers, error: approverUserError } = await supabaseAdmin
        .from("user_accounts")
        .select("id, employee_id")
        .in("id", approverIds);

      if (approverUserError) throw approverUserError;

      const employeeIds = [
        ...new Set(
          approverUsers
            .map((user: any) => user.employee_id)
            .filter(Boolean)
        ),
      ];

      const { data: approverEmployees, error: approverEmpError } =
        await supabaseAdmin
          .from("employees")
          .select("id, first_name_th, last_name_th")
          .in("id", employeeIds);

      if (approverEmpError) throw approverEmpError;

      const approverEmpMap = new Map(
        approverEmployees.map((emp: any) => [
          emp.id,
          `${emp.first_name_th || ""} ${emp.last_name_th || ""}`.trim(),
        ])
      );

      approverUsers.forEach((user: any) => {
        const name = approverEmpMap.get(user.employee_id) || "ไม่ระบุ";
        approverNameByUserId.set(user.id, name);
      });
    }

    // 4. จัด Format ข้อมูล
    const formatted = evaluations.map((item: any) => {
      const emp = empMap.get(item.employee_id);
      const evaluator = empMap.get(item.evaluator_id);

      const rawScore = item.totalScore || 0;
      const maxScore = item.maxScore || 100;
      const scorePercent = Math.round((rawScore / maxScore) * 100);
      const calculatedGrade = getGrade(scorePercent);

      const levelMapping =
        emp?.positions?.position_level_mappings?.find(
          (m: any) => m.is_default
        ) || emp?.positions?.position_level_mappings?.[0];
      const positionLevel = levelMapping?.position_levels;
      const levelCode =
        positionLevel?.level_code || positionLevel?.level_name || "";

      const displayLevel = item.newLevel || levelCode || "P1";
      const deptName =
        emp?.departments?.department_name || "ไม่ระบุแผนก";
      const posName = emp?.positions?.position_name || "พนักงาน";

      return {
        id: item.id,
        name: `${emp?.first_name_th || ""} ${emp?.last_name_th || ""}`
          .trim()
          || "ไม่พบชื่อ",
        grade: calculatedGrade,
        initials:
          emp?.first_name_en?.[0] ||
          emp?.first_name_th?.[0] ||
          "?",
        title: posName,
        score: scorePercent,
        scoreClass:
          scorePercent >= 80
            ? "text-emerald-600"
            : "text-amber-600",
        avatarClass: deptName.includes("HR")
          ? "bg-pink-50 text-pink-700"
          : "bg-blue-50 text-blue-700",
        evaluatorName: evaluator
          ? `${evaluator.first_name_th} ${evaluator.last_name_th}`
          : "ไม่ระบุ",
        approvedByName: item.approved_by
          ? approverNameByUserId.get(item.approved_by) || "ไม่ระบุ"
          : null,
        rejectedByName: item.rejected_by
          ? approverNameByUserId.get(item.rejected_by) || "ไม่ระบุ"
          : null,
        completedDate: item.completedAt
          ? new Date(item.completedAt).toLocaleDateString("th-TH")
          : new Date(item.created_at).toLocaleDateString("th-TH"),
        quarter: `Level ${displayLevel}`,
        tags: [
          {
            label: deptName,
            className: deptName.includes("HR")
              ? "bg-pink-50 text-pink-700"
              : "bg-blue-50 text-blue-700",
          },
          {
            label: item.rm_evaluation_types?.name || "ทั่วไป",
            className: "bg-violet-50 text-violet-700",
          },
          {
            label: displayLevel,
            className: "bg-slate-100 text-slate-600",
          },
        ],
      };
    });

    // 5. คำนวณ Stats
    const avgScorePercent = Math.round(
      formatted.reduce((acc, curr) => acc + curr.score, 0) /
        formatted.length
    );
    const uniqueDepts = new Set(
      employeeRows?.map((e: any) => e.department_id).filter(Boolean)
    ).size;

    return NextResponse.json({
      stats: {
        completed: formatted.length,
        deptCount: uniqueDepts,
        avgScore: avgScorePercent,
        topName:
          [...formatted].sort((a, b) => b.score - a.score)[0]?.name || "-",
      },
      employees: formatted,
    });
  } catch (err: any) {
    console.error("Executive API Error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}