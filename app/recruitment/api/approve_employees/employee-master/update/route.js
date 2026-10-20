import { withActivity, setActivityDetails } from "@/app/recruitment/lib/activity/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { ContractDataError } from "@/app/recruitment/lib/contracts/errors";
import { approvalAccess, approveApplication, approvalFailure, approvalRpc, isApprovalId, isApprovalDate } from "../approval";

class AppError extends Error {
  constructor(message) {
    super(message);
    this.isSafeMessage = true;
  }
}

function calculateProbationEndDate(startDate, probationDays = 119) {
  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("วันที่เริ่มงานไม่ถูกต้อง");
  }

  date.setUTCDate(date.getUTCDate() + probationDays);

  return date.toISOString().split("T")[0];
}

const STATUS = {
  NO_SHOW: 14,
  RESCHEDULE: 13,
  STAGE_ONE: 12,
  PENDING_CONFIRM: 17,
  CONFIRMED: 15,
};

const badRequest = (message) => NextResponse.json({ message }, { status: 400 });

// Returns the message for the first "falsy" field, or null if all present.
const firstMissingFieldMessage = (fields) => {
  for (const [value, message] of fields) {
    if (!value) return message;
  }
  return null;
};

// ============================================================
// Reschedule / No-show
// Shared by: status 13/14 (direct update) and 17 -> 13/14 transition
// Returns a NextResponse on error, or null on success.
// ============================================================

async function rescheduleApplication({ application, userId, targetStatus, startDate, reason, requireReason }) {
  if (requireReason && !String(reason || "").trim()) {
    return badRequest("กรุณาระบุเหตุผล");
  }
  if (!startDate) {
    return badRequest("กรุณาระบุวันที่เริ่มงาน");
  }


  const updatePayload = { start_date: startDate };
  if (requireReason) updatePayload.status = targetStatus;
  if (requireReason || String(reason || "").trim()) {
    updatePayload.status_reason = reason;
  }

  await approvalRpc("recruit_approval_save", {
    p_application_id: String(application.id), p_actor: userId,
    p_expected: application, p_changes: updatePayload, p_costs: null,
  });
  return null;
}

// ============================================================
// Additional cost / compensation rows
// ============================================================

function buildAdditionalCostRows(applicationId, additionalCompensation = [], additionalCost = []) {
  const rows = [];

  for (const item of additionalCompensation) {
    for (const [topic, amount] of Object.entries(item)) {
      rows.push({ application_id: applicationId, cost_type: "compensation", topic, amount: Number(amount || 0) });
    }
  }

  for (const item of additionalCost) {
    const topic = item.name?.trim();
    if (!topic) continue;
    rows.push({ application_id: applicationId, cost_type: "additional", topic, amount: Number(item.amount || 0) });
  }

  return rows;
}

// ============================================================
// Stage 1: status 12 -> 17
// Save application details, wait for the final confirmation call.
// Returns a NextResponse on error, or null on success.
// ============================================================

async function processStageOneApproval({ application, body, userId }) {
  const { data: company, error: companyError } = await supabaseAdmin
    .from("branches")
    .select("*")
    .eq("id", body.branch_id)
    .single();
  if (companyError) {
    console.error("GET COMPANY ERROR:", companyError);
    throw new AppError("ไม่สามารถดึงข้อมูล Branch ได้");
  }

  const { data: payrollCompany, error: payrollCompanyError } = await supabaseAdmin
    .from("payroll_companies")
    .select("*")
    .eq("company_id", company.company_id)
    .single();
  if (payrollCompanyError) {
    console.error("GET PAYROLL COMPANY ERROR:", payrollCompanyError);
    throw new AppError("ไม่สามารถดึงข้อมูล payrol ได้");
  }

  const { data: empstatus, error: empstatusError } = await supabaseAdmin
    .from("employee_statuses")
    .select("id")
    .eq("status_code", "PROBATION")
    .single();

  if (empstatusError || !empstatus?.id) {
    console.error("GET PROBATION EMPLOYEE STATUS ERROR:", empstatusError);
    throw new AppError("ไม่พบสถานะพนักงานรหัส PROBATION");
  }

  const probationDays = 119;
  const probationEndDate = calculateProbationEndDate(body.start_date, probationDays);

  const applicationUpdate = {
    branch_id: body.branch_id,
    department_id: body.department_id,
    division_id: body.division_id,
    unit_id: body.unit_id,
    position_id: body.position_id,
    position_level_id: body.position_level_id,
    start_date: body.start_date,
    base_salary: body.base_salary,
    position_allowance: body.position_allowance,
    living_allowance: body.living_allowance,
    special_allowance: body.special_allowance,
    fuel_allowance: body.fuel_allowance,
    incentive_type: body.incentive_type,
    incentive_amount: body.incentive_amount,
    oc: body.oc,
    deposit: body.deposit,
    deduct_processing: body.deduct_processing,
    deduct_resign_within_one_year: body.deduct_resign_within_one_year,
    phone_allowance: body.phone_allowance,
    employment_type: body.employment_type,
    employment_type_id: body.employment_type_id,
    employee_status_id: empstatus.id,
    probation_days: probationDays,
    probation_end_date: probationEndDate,
    company_id: company.company_id,
    branch_group_id: company.group_id,
    payroll_company_id: payrollCompany.id,
    payroll_type_id: body.payroll_types,
    position_family_id: body.position_family_id,
    last_job_id: body.job_id,
    status: STATUS.PENDING_CONFIRM,
  };

  const costRows = buildAdditionalCostRows(application.id, body.additional_compensation, body.additional_cost);
  await approvalRpc("recruit_approval_save", {
    p_application_id: String(application.id), p_actor: userId, p_expected: application,
    p_changes: applicationUpdate, p_costs: costRows,
  });

  return null;
}

// ============================================================
// Single-person status changes; final approval shares the batch service.
// ============================================================

async function handlePOST(request) {
  try {
    const guard = await approvalAccess();
    if (!guard.ok) return guard.response;
    const userId = guard.user.id;
    let body;
    try { body = await request.json(); } catch { return badRequest("รูปแบบข้อมูลไม่ถูกต้อง"); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("รูปแบบข้อมูลไม่ถูกต้อง");
    const { application_id, status: submittedStatus, next_status, reason, start_date } = body;
    if (!isApprovalId(application_id)) return badRequest("Application ID ไม่ถูกต้อง");
    if (![12, 13, 14, 17].includes(Number(submittedStatus))) {
      return badRequest("กรุณาโหลดสถานะใบสมัครใหม่ก่อนบันทึก");
    }

    // Both single and batch confirmation read stored application values on the server.
    if (Number(submittedStatus) === 17 && Number(next_status || 15) === 15) {
      setActivityDetails({ action: "APPROVE" });
      const result = await approveApplication({ application_id, role_id: body.role_id });
      return NextResponse.json(result, { status: result.already_approved ? 200 : 201 });
    }

    if (Number(submittedStatus) === 12) {
      const msg = firstMissingFieldMessage([
        [body.branch_id, "กรุณาเลือก Branch"],
        [body.department_id, "กรุณาเลือก Department"],
        [body.division_id, "กรุณาเลือก Division"],
        [body.unit_id, "กรุณาเลือก Unit"],
        [body.position_id, "กรุณาเลือก Position"],
        [body.position_level_id, "กรุณาเลือก Position Level"],
        [body.employment_type, "ประเภทสำหรับสร้างรหัส"],
        [body.employment_type_id, "กรุณาเลือกประเภทการจ้างงาน"],
      ]);
      if (msg) return badRequest(msg);
    }

    const commonMsg = firstMissingFieldMessage([
      [application_id, "ไม่พบ Application ID"],
      [start_date, "กรุณาระบุวันที่เริ่มงาน"],
    ]);
    if (commonMsg) return badRequest(commonMsg);
    if (!isApprovalDate(start_date)) return badRequest("วันที่เริ่มงานไม่ถูกต้อง");

    // --- Load application ---
    const { data: application, error: getAppError } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*")
      .eq("id", application_id)
      .single();
    if (getAppError) {
      console.error("GET RECRUIT APPLICATION ERROR:", getAppError);
      throw new AppError("ไม่สามารถดึงข้อมูลผู้สมัครได้");
    }
    if (!application) {
      return NextResponse.json({ success: false, message: "ไม่พบข้อมูลผู้สมัคร" }, { status: 404 });
    }

    if (!guard.canAccessEmployee(application)) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ในหน่วยงานนี้" }, { status: 403 });
    }
    if (Number(application.status) === 12 && !guard.canAccessEmployee({ ...application, ...body })) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ในหน่วยงานปลายทาง" }, { status: 403 });
    }

    // --- Staleness check: the status the frontend saw must match the DB now ---
    if (
      submittedStatus !== undefined &&
      submittedStatus !== null &&
      Number(submittedStatus) !== Number(application.status)
    ) {
      return NextResponse.json(
        { success: false, message: "สถานะของใบสมัครมีการเปลี่ยนแปลงไปแล้ว กรุณาโหลดข้อมูลใหม่อีกครั้ง" },
        { status: 409 }
      );
    }

    const currentStatus = Number(application.status);

    // --- status 13/14: reschedule / no-show only, no employee creation ---
    if (currentStatus === STATUS.NO_SHOW || currentStatus === STATUS.RESCHEDULE) {
      const errRes = await rescheduleApplication({
        application, userId,
        targetStatus: currentStatus,
        startDate: start_date,
        reason,
        requireReason: false,
      });
      if (errRes) return errRes;

      return NextResponse.json({ success: true, message: "อัปเดตวันที่เริ่มงานเรียบร้อยแล้ว" }, { status: 200 });
    }

    // --- status 12: save details, move to pending confirmation (17) ---
    if (currentStatus === STATUS.STAGE_ONE) {
      setActivityDetails({ action: "APPROVE" });
      const errRes = await processStageOneApproval({
        application,
        body,
        userId,
      });

      if (errRes) return errRes;

      return NextResponse.json(
        {
          success: true,
          message: "บันทึกข้อมูลเรียบร้อยแล้ว",
        },
        { status: 200 }
      );
    }

    // --- status 17: either reschedule/no-show, or final confirmation (15) ---
    if (currentStatus === STATUS.PENDING_CONFIRM) {
      const resolvedNextStatus = next_status ? Number(next_status) : STATUS.CONFIRMED;

      if (resolvedNextStatus === STATUS.NO_SHOW || resolvedNextStatus === STATUS.RESCHEDULE) {
        const errRes = await rescheduleApplication({
          application, userId,
          targetStatus: resolvedNextStatus,
          startDate: start_date,
          reason,
          requireReason: true,
        });
        if (errRes) return errRes;

        return NextResponse.json({ success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" }, { status: 200 });
      }

      return badRequest("กรุณาโหลดข้อมูลใหม่ก่อนยืนยันการอนุมัติ");

    }

    return badRequest("สถานะใบสมัครไม่รองรับการดำเนินการนี้");
  } catch (error) {
    console.error("SAVE EMPLOYEE ERROR:", { code: error?.code });
    if (error?.status || error instanceof ContractDataError) {
      const failure = approvalFailure(error);
      return NextResponse.json(failure, { status: failure.http_status });
    }
    return NextResponse.json(
      {
        success: false,
        message: error?.isSafeMessage ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}

export const POST = withActivity(handlePOST, {"page_path": "/recruitment/approve_employees", "action": "UPDATE_STATUS", "resource_type": "candidate", "idField": "application_id", resolveAction: (response) => response.status === 201 ? "APPROVE" : "UPDATE_STATUS" });
