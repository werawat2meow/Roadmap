import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const checklistTemplate = (evaluationType: string | null) => {
  const type = evaluationType || "";
  return [
    {
      key: "salary_history",
      label: "ตรวจสอบประวัติการปรับค่าจ้างเป็นไปตามหลักเกณฑ์",
      applicability: type === "Probation" ? "not_applicable" : "required",
    },
    {
      key: "expectation_notified",
      label: "แจ้งความคาดหวังให้พนักงานทราบล่วงหน้า",
      applicability: "required",
    },
    {
      key: "hrd_interview",
      label: "ผ่านการสัมภาษณ์จาก HRD",
      applicability: ["Promotion", "Progression"].includes(type)
        ? "required"
        : "not_applicable",
    },
    {
      key: "performance_period",
      label: "ระยะเวลาการทำผลงานเป็นไปตามหลักเกณฑ์",
      applicability: "required",
    },
    {
      key: "manager_score",
      label: "คะแนนการประเมินจากหัวหน้างานเป็นไปตามหลักเกณฑ์",
      applicability: "required",
    },
    {
      key: "exam_score",
      label: "คะแนนการทำข้อสอบผ่านเกณฑ์ที่กำหนด",
      applicability: "required",
    },
    {
      key: "discipline",
      label: "ระเบียบวินัยเป็นไปตามหลักเกณฑ์",
      applicability: "required",
    },
    {
      key: "special_interview",
      label: "ผ่านการสัมภาษณ์จากคุณม่อน (กรณี P7 ปรับขึ้น P8)",
      applicability: "conditional",
    },
    {
      key: "mandatory_training",
      label: "อบรมครบตามหลักสูตรบังคับ",
      applicability: "required",
    },
    {
      key: "outside_form",
      label: "ทำแบบฟอร์มประวัติการทำงานนอกหรืองานอดิเรก",
      applicability: "required",
    },
    {
      key: "employment_contract",
      label: "ออกสัญญาจ้าง",
      applicability: "required",
    },
  ];
};

const checklistTemplateV2 = (evaluationType: string | null) => {
  const type = evaluationType || "";
  const isPromotionPath = ["Promotion", "Promote", "Progression"].includes(
    type,
  );
  const isP7ToP8 =
    type === "Promotion" || type === "Promote" || type === "Progression";

  return [
    {
      key: "salary_history",
      phase: "before",
      label: "ตรวจสอบประวัติการปรับค่าจ้าง สวัสดิการ และตำแหน่ง",
      applicability: type === "Probation" ? "not_applicable" : "required",
    },
    {
      key: "expectation_notified",
      phase: "before",
      label:
        "แจ้งหัวข้อความคาดหวังให้พนักงานทราบล่วงหน้า หรือจัดทำให้พนักงานลงนามรับทราบ",
      applicability: "required",
    },
    {
      key: "hrd_interview",
      phase: "before",
      label: "สัมภาษณ์พนักงานที่เลื่อน Promotion และ Progression โดย HRD",
      applicability: isPromotionPath ? "required" : "not_applicable",
    },
    {
      key: "performance_period",
      phase: "before",
      label: "ตรวจเช็คระยะเวลาในการทำผลงานตามความคาดหวังที่กำหนด",
      applicability: "required",
    },
    {
      key: "manager_score",
      phase: "before",
      label: "ตรวจเช็คคะแนนประเมินจากหัวหน้างานเป็นไปตามหลักเกณฑ์ที่กำหนด",
      applicability: "required",
    },
    {
      key: "exam_score",
      phase: "before",
      label: "ตรวจเช็คคะแนนการทำข้อสอบ ผ่านเกณฑ์ที่กำหนด",
      applicability: "required",
    },
    {
      key: "discipline",
      phase: "before",
      label:
        "ตรวจเช็คประวัติการกระทำผิดทางวินัย และยืนยันว่าไม่ต่อเงื่อนไขการปรับ",
      applicability: "required",
    },
    {
      key: "special_interview",
      phase: "before",
      label: "การเลื่อนระดับ P7 เป็น P8 ต้องผ่านการสัมภาษณ์โดยคุณม่อน",
      applicability: isP7ToP8 ? "conditional" : "not_applicable",
    },
    {
      key: "mandatory_training",
      phase: "before",
      label:
        "พนักงานผ่านการอบรมครบตามหลักสูตรบังคับ และข้อกำหนดของระดับตำแหน่งหรือไม่",
      applicability: type === "Probation" ? "not_applicable" : "required",
    },
    {
      key: "outside_form",
      phase: "before",
      label: "ตรวจเช็คแบบฟอร์มประวัติการทำงานนอก หรืองานอดิเรก",
      applicability: type === "Probation" ? "not_applicable" : "required",
    },
    {
      key: "new_contract_signed",
      phase: "after",
      label: "พนักงานได้ลงนามในเอกสารแจ้งสวัสดิการ และสัญญาจ้างฉบับใหม่แล้ว",
      applicability: "required",
    },
    {
      key: "salary_order_signed",
      phase: "after",
      label: "พนักงานได้ลงนามในแบบคำสั่งจ่ายการปรับค่าจ้างภายในบริษัทแล้ว",
      applicability: "required",
    },
    {
      key: "new_orientation",
      phase: "after",
      label: "พนักงานได้รับการปฐมนิเทศใหม่แล้ว",
      applicability: "required",
    },
  ];
};

const mergeChecklist = (evaluationType: string | null, saved: any) => {
  const savedMap = new Map(
    (Array.isArray(saved) ? saved : []).map((item: any) => [item.key, item]),
  );

  return checklistTemplateV2(evaluationType).map((item) => ({
    ...item,
    status:
      item.applicability === "not_applicable"
        ? "not_applicable"
        : savedMap.get(item.key)?.status || "not_started",
    note: savedMap.get(item.key)?.note || "",
    checkedAt: savedMap.get(item.key)?.checkedAt || null,
  }));
};

export async function GET() {
  try {
    const { data: evaluations, error } = await supabaseAdmin
      .from("rm_evaluations")
      .select(
        "id,employee_id,evaluator_id,status,approved_at,created_at,totalScore,maxScore,grade,companyScore,departmentScore,expectationScore,examScore,currentSalary,newSalary,new_designation,new_level,special_compensation,salary_effective_month,approval_note,extra_data,rm_evaluation_types(name)",
      )
      .in("status", ["Submitted", "Completed"])
      .order("approved_at", { ascending: false, nullsFirst: false });

    if (error) throw error;

    const employeeIds = [
      ...new Set((evaluations || []).map((item: any) => item.employee_id)),
    ];
    const { data: employees, error: employeeError } = employeeIds.length
      ? await supabaseAdmin
          .from("employees")
          .select(
            "id,employee_code,first_name_th,last_name_th,nick_name,department_id,hire_date,position_level_id,position_levels(level_code,level_name),positions(position_name,position_level_mappings(is_default,position_levels(level_code,level_name)))",
          )
          .in("id", employeeIds)
      : { data: [], error: null };

    if (employeeError) throw employeeError;
    const employeeMap = new Map(
      (employees || []).map((employee: any) => [employee.id, employee]),
    );
    const evaluatorIds = [
      ...new Set((evaluations || []).map((item: any) => item.evaluator_id).filter(Boolean)),
    ];
    const { data: evaluators, error: evaluatorError } = evaluatorIds.length
      ? await supabaseAdmin
          .from("employees")
          .select("id,first_name_th,last_name_th")
          .in("id", evaluatorIds)
      : { data: [], error: null };

    if (evaluatorError) throw evaluatorError;
    const evaluatorMap = new Map(
      (evaluators || []).map((evaluator: any) => [
        evaluator.id,
        `${evaluator.first_name_th || ""} ${evaluator.last_name_th || ""}`.trim(),
      ]),
    );
    const { data: bankAccounts, error: bankError } = employeeIds.length
      ? await supabaseAdmin
          .from("employee_bank_accounts")
          .select("employee_id,account_no,banks(bank_name_th,bank_short_name)")
          .in("employee_id", employeeIds)
          .eq("is_primary", true)
      : { data: [], error: null };

    if (bankError) throw bankError;
    const bankMap = new Map(
      (bankAccounts || []).map((account: any) => [
        account.employee_id,
        {
          bank: account.banks?.bank_name_th || account.banks?.bank_short_name || "-",
          accountNo: account.account_no || "-",
        },
      ]),
    );
    const departmentIds = [
      ...new Set(
        (employees || [])
          .map((employee: any) => employee.department_id)
          .filter(Boolean),
      ),
    ];
    const { data: departments, error: departmentError } = departmentIds.length
      ? await supabaseAdmin
          .from("departments")
          .select("id,department_name")
          .in("id", departmentIds)
      : { data: [], error: null };

    if (departmentError) throw departmentError;
    const departmentMap = new Map(
      (departments || []).map((department: any) => [
        department.id,
        department.department_name,
      ]),
    );

    return NextResponse.json({
      success: true,
      data: (evaluations || []).map((evaluation: any) => {
        const employee = employeeMap.get(evaluation.employee_id) || {};
        const extraData = evaluation.extra_data || {};
        const evaluationType = evaluation.rm_evaluation_types?.name || null;
        const checklist = mergeChecklist(evaluationType, extraData.checklist);
        const levelMapping = employee.positions?.position_level_mappings?.find(
          (mapping: any) => mapping.is_default,
        ) || employee.positions?.position_level_mappings?.[0];
        const employeeLevel = employee.position_levels;
        const bank = bankMap.get(evaluation.employee_id) || { bank: "-", accountNo: "-" };

        return {
          id: evaluation.id,
          employeeId: evaluation.employee_id,
          employeeCode: employee.employee_code || "-",
          employeeName:
            `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim() ||
            "-",
          nickname: employee.nick_name || "-",
          department:
            departmentMap.get(employee.department_id) ||
            employee.department_id ||
            "-",
          company: extraData.company || extraData.companyName || "-",
          evaluatorName: evaluatorMap.get(evaluation.evaluator_id) || "-",
          position: employee.positions?.position_name || "-",
          level: employeeLevel?.level_code || employeeLevel?.level_name || levelMapping?.position_levels?.level_code || levelMapping?.position_levels?.level_name || "-",
          hireDate: employee.hire_date,
          salaryEffectiveMonth: extraData.salaryEffectiveMonth || evaluation.salary_effective_month || "-",
          evaluationDays: extraData.evaluationDays ?? extraData.days ?? "-",
          currentPosition: extraData.currentPosition || employee.positions?.position_name || "-",
          currentLevel: extraData.currentLevel || levelMapping?.position_levels?.level_code || "-",
          currentSalary: evaluation.currentSalary,
          positionAllowance: extraData.positionAllowance ?? "-",
          livingAllowance: extraData.livingAllowance ?? "-",
          specialAllowance: extraData.specialAllowance ?? "-",
          fuelAllowance: extraData.fuelAllowance ?? "-",
          currentTotalSalary: extraData.currentTotalSalary ?? evaluation.currentSalary ?? "-",
          newDesignation: evaluation.new_designation || "-",
          newLevel: evaluation.new_level || "-",
          newSalary: evaluation.newSalary,
          newPositionAllowance: extraData.newPositionAllowance ?? "-",
          newLivingAllowance: extraData.newLivingAllowance ?? "-",
          newSpecialAllowance: extraData.newSpecialAllowance ?? evaluation.special_compensation ?? "-",
          newFuelAllowance: extraData.newFuelAllowance ?? "-",
          newTotalSalary: extraData.newTotalSalary ?? evaluation.newSalary ?? "-",
          salaryIncrease: extraData.salaryIncrease ?? (evaluation.currentSalary != null && evaluation.newSalary != null ? evaluation.newSalary - evaluation.currentSalary : "-"),
          salaryDecrease: extraData.salaryDecrease ?? "-",
          examScore: evaluation.examScore,
          disciplineScore: extraData.disciplineScore ?? extraData.disciplineData?.score ?? "-",
          bankName: bank.bank,
          accountNumber: bank.accountNo,
          approvalNote: evaluation.approval_note || "-",
          evaluationType,
          evaluationStatus: evaluation.status,
          approvedAt: evaluation.approved_at,
          totalScore: evaluation.totalScore,
          maxScore: evaluation.maxScore,
          grade: evaluation.grade,
          checklist,
        };
      }),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load checklist" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const evaluationId = String(body?.evaluationId || "");
    const checklist = Array.isArray(body?.checklist) ? body.checklist : null;

    if (!evaluationId || !checklist) {
      return NextResponse.json(
        { success: false, error: "Missing evaluationId or checklist" },
        { status: 400 },
      );
    }

    const { data: evaluation, error: findError } = await supabaseAdmin
      .from("rm_evaluations")
      .select("extra_data")
      .eq("id", evaluationId)
      .single();

    if (findError) throw findError;

    const cleanChecklist = checklist.map((item: any) => ({
      key: String(item.key),
      status: String(item.status || "not_started"),
      note: String(item.note || ""),
      checkedAt:
        item.status === "not_started" ? null : new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from("rm_evaluations")
      .update({
        extra_data: {
          ...(evaluation?.extra_data || {}),
          checklist: cleanChecklist,
        },
      })
      .eq("id", evaluationId)
      .select("id,extra_data")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save checklist" },
      { status: 500 },
    );
  }
}
