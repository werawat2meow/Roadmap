import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import bcrypt from "bcryptjs";
import { reserveEmployeeCode } from "@/lib/employee/employeeCodeGenerator";

const text = (value) => String(value ?? "").trim();
const optional = (value) => text(value) || null;
const fail = (error, status = 400) => NextResponse.json({ success: false, error }, { status });
const validationError = (message) => Object.assign(new Error(message), { status: 400 });

async function one(table, id, columns) {
  const { data, error } = await supabaseAdmin.from(table).select(columns).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function POST(request) {
  const guard = await requireScopedAccess("ems.employees", "create");
  if (!guard.ok) return guard.response;

  let createdAuthUserId = null;
  let createdEmployeeId = null;
  let createdNewPositionId = null;
  try {
    const body = await request.json();
    const createUserAccount = body.create_user_account === true;
    const salaryText = text(body.base_salary);
    if (salaryText && !/^\d{1,12}(\.\d{1,2})?$/.test(salaryText)) {
      return fail("เงินเดือนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
    }
    let employeeCode = text(body.employee_code);
    const legacyCodes = (Array.isArray(body.legacy_codes) ? body.legacy_codes : [])
      .map(text).filter(Boolean);
    if ((!employeeCode && !createUserAccount) || !text(body.first_name_th) || !text(body.last_name_th) ||
        !text(body.start_work_date) || !text(body.branch_id) || !text(body.department_id) ||
        !text(body.position_id) || !text(body.position_level_id)) {
      return fail("กรอกรหัสพนักงาน ชื่อและนามสกุลไทย วันที่เริ่มงาน สังกัด แผนก ตำแหน่ง และ Level P");
    }
    if (legacyCodes.length !== new Set(legacyCodes).size || legacyCodes.includes(employeeCode)) {
      return fail("รหัสพนักงานเก่าต้องไม่ซ้ำกันหรือซ้ำกับรหัสปัจจุบัน");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text(body.start_work_date)) ||
        (body.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(text(body.birth_date)))) {
      return fail("รูปแบบวันที่ไม่ถูกต้อง");
    }

    const branch = await one("branches", body.branch_id, "id,company_id,group_id,status");
    const department = await one("departments", body.department_id, "id,status");
    const creatingPosition = body.position_id === "__new__";
    const newPositionName = text(body.new_position_name);
    if (creatingPosition && (!newPositionName || newPositionName.length > 200)) {
      return fail("กรุณากรอกชื่อตำแหน่งใหม่ไม่เกิน 200 ตัวอักษร");
    }
    const position = creatingPosition ? null : await one("positions", body.position_id, "id,position_family_id,job_id,status,is_executive");
    const level = await one("position_levels", body.position_level_id, "id,level_code,status");
    if (!branch || !department || (!creatingPosition && !position) || !level ||
        branch.status !== "active" || department.status !== "active" || (!creatingPosition && position.status !== "active") ||
        !/^P\d+$/i.test(level.level_code ?? "")) return fail("สังกัด แผนก ตำแหน่ง หรือ Level P ไม่ถูกต้อง");
    if (!guard.canAccessEmployee({ company_id: branch.company_id, branch_id: branch.id,
      department_id: department.id, division_id: body.division_id || null, unit_id: body.unit_id || null })) {
      return fail("ไม่มีสิทธิ์เพิ่มพนักงานในสังกัดนี้", 403);
    }
    const { data: link, error: linkError } = await supabaseAdmin.from("branch_departments")
      .select("id").eq("branch_id", branch.id).eq("department_id", department.id).maybeSingle();
    if (linkError) throw linkError;
    if (!link) return fail("แผนกไม่อยู่ในสังกัดที่เลือก");
    if (body.division_id) {
      const division = await one("divisions", body.division_id, "id,department_id,status");
      if (!division || division.department_id !== department.id || division.status !== "active") return fail("ฝ่ายไม่อยู่ในแผนกที่เลือก");
    }
    if (body.unit_id) {
      const unit = await one("units", body.unit_id, "id,division_id,status");
      if (!body.division_id || !unit || unit.division_id !== body.division_id || unit.status !== "active") return fail("หน่วยไม่อยู่ในฝ่ายที่เลือก");
    }
    if (!creatingPosition) {
      const { data: mapping, error: mappingError } = await supabaseAdmin.from("position_level_mappings")
        .select("id").eq("position_id", position.id).eq("position_level_id", level.id).maybeSingle();
      if (mappingError) throw mappingError;
      if (!mapping) return fail("Level P ไม่ตรงกับตำแหน่งที่เลือก");
    }

    const { data: existing, error: existingError } = await supabaseAdmin.from("employees")
      .select("id").eq("employee_code", employeeCode).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return fail("รหัสพนักงานนี้ถูกใช้แล้ว", 409);
    const { data: currentCodeAsLegacy, error: currentLegacyError } = await supabaseAdmin
      .from("employee_legacy_codes").select("id").eq("legacy_code", employeeCode).limit(1);
    if (currentLegacyError) throw currentLegacyError;
    if (currentCodeAsLegacy?.length) return fail("รหัสพนักงานนี้ถูกใช้เป็นรหัสเก่าของพนักงานคนอื่นแล้ว", 409);
    if (legacyCodes.length) {
      const { data: currentMatches, error: currentMatchesError } = await supabaseAdmin
        .from("employees").select("employee_code").in("employee_code", legacyCodes).limit(1);
      if (currentMatchesError) throw currentMatchesError;
      if (currentMatches?.length) return fail(`รหัสเก่า ${currentMatches[0].employee_code} เป็นรหัสปัจจุบันของพนักงานคนอื่น`, 409);
      const { data: taken, error: takenError } = await supabaseAdmin.from("employee_legacy_codes")
        .select("legacy_code").in("legacy_code", legacyCodes).limit(1);
      if (takenError) throw takenError;
      if (taken?.length) return fail(`รหัสเก่า ${taken[0].legacy_code} ถูกใช้แล้ว`, 409);
    }

    let savedPosition = position;
    let createdNewPosition = false;
    if (creatingPosition) {
      const { data: sameName, error: nameError } = await supabaseAdmin.from("positions")
        .select("id,position_family_id,job_id,status").ilike("position_name", newPositionName).limit(1);
      if (nameError) throw nameError;
      if (sameName?.length) {
        if (sameName[0].status !== "active") return fail("ชื่อตำแหน่งนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
        savedPosition = sameName[0];
      } else {
        const { data: createdPosition, error: positionError } = await supabaseAdmin.from("positions")
          .insert({ position_code: `POS-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
            position_name: newPositionName, status: "active" })
          .select("id,position_family_id,job_id,status").single();
        if (positionError) throw positionError;
        savedPosition = createdPosition;
        createdNewPosition = true;
        createdNewPositionId = createdPosition.id;
      }
      const { error: newMappingError } = await supabaseAdmin.from("position_level_mappings")
        .upsert({ position_id: savedPosition.id, position_level_id: level.id,
          is_default: createdNewPosition }, { onConflict: "position_id,position_level_id", ignoreDuplicates: true });
      if (newMappingError) {
        if (createdNewPosition) await supabaseAdmin.from("positions").delete().eq("id", savedPosition.id);
        throw newMappingError;
      }
    }

    let defaultRole = null;
    if (createUserAccount) {
      const { data: setting, error: settingError } = await supabaseAdmin
        .from("employee_code_settings")
        .select("id")
        .eq("company_id", branch.company_id)
        .eq("status", "active")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (settingError) throw settingError;
      if (!setting) throw validationError("บริษัทนี้ยังไม่มีรูปแบบรหัสพนักงานที่เปิดใช้งาน");

      const codeResult = await reserveEmployeeCode({
        companyId: branch.company_id,
        settingId: setting.id,
        employeeType: savedPosition?.is_executive ? "executive" : "thai",
        // The employee's start date may be historical. Use today's date for
        // code-setting validation and running-year generation.
        runningDate: new Date().toISOString().slice(0, 10),
        skipEffectiveDateCheck: true,
      });
      if (!codeResult.success) throw validationError(codeResult.message || "สร้างรหัสพนักงานไม่สำเร็จ");
      employeeCode = codeResult.data.employee_code;
      if (legacyCodes.includes(employeeCode)) {
        return fail("รหัสเก่าต้องไม่ซ้ำกับรหัสที่ระบบสร้าง");
      }

      const { data: role, error: roleError } = await supabaseAdmin
        .from("roles")
        .select("id,role_code,is_active")
        .eq("role_code", "EMS_ADMIN")
        .eq("is_active", true)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!role) throw validationError("ยังไม่มี Role EMS_ADMIN ที่เปิดใช้งาน");
      defaultRole = role;
    }

    const { data: existingGenerated, error: generatedError } = await supabaseAdmin
      .from("employees").select("id").eq("employee_code", employeeCode).maybeSingle();
    if (generatedError) throw generatedError;
    if (existingGenerated) return fail("รหัสพนักงานที่ระบบสร้างมีอยู่แล้ว กรุณาลองใหม่", 409);

    const row = {
      employee_code: employeeCode,
      first_name_th: text(body.first_name_th), last_name_th: text(body.last_name_th),
      first_name_en: optional(body.first_name_en), last_name_en: optional(body.last_name_en),
      nickname_th: optional(body.nickname_th), nick_name: optional(body.nickname_th),
      title_id: optional(body.title_id), gender_id: optional(body.gender_id),
      birth_date: optional(body.birth_date), citizen_id: optional(body.citizen_id),
      passport_no: optional(body.passport_no), start_work_date: text(body.start_work_date),
      hire_date: text(body.start_work_date), company_id: branch.company_id,
      branch_group_id: branch.group_id, branch_id: branch.id, department_id: department.id,
      division_id: optional(body.division_id), unit_id: optional(body.unit_id),
      position_id: savedPosition.id, position_family_id: savedPosition.position_family_id,
      job_id: savedPosition.job_id, position_level_id: level.id,
      employee_photo_url: optional(body.employee_photo_url),
      employee_photo_path: optional(body.employee_photo_path),
      status: "active",
    };
    const { data: created, error: createError } = await supabaseAdmin.from("employees")
      .insert(row).select("id,employee_code").single();
    if (createError) {
      if (createdNewPosition) await supabaseAdmin.from("positions").delete().eq("id", savedPosition.id);
      if (createError.code === "23505") return fail("รหัสพนักงานนี้ถูกใช้แล้ว", 409);
      throw createError;
    }
    createdEmployeeId = created.id;
    if (salaryText) {
      const { error: salaryError } = await supabaseAdmin.from("employee_compensations").insert({
        employee_id: created.id,
        position_id: savedPosition.id,
        position_level_id: level.id,
        base_salary: salaryText,
        currency_code: "THB",
        effective_from: text(body.start_work_date),
        source_type: "initial",
        status: "active",
        reason: "Initial employee compensation",
      });
      if (salaryError) {
        const { error: rollbackError } = await supabaseAdmin.from("employees").delete().eq("id", created.id);
        if (rollbackError) return fail("เพิ่มพนักงานแล้วแต่บันทึกเงินเดือนไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ", 500);
        if (createdNewPosition) await supabaseAdmin.from("positions").delete().eq("id", savedPosition.id);
        throw salaryError;
      }
    }
    if (legacyCodes.length) {
      const { error: legacyError } = await supabaseAdmin.from("employee_legacy_codes").insert(
        legacyCodes.map((legacy_code) => ({ employee_id: created.id,
          company_id: branch.company_id, source_system: "LEGACY_EXCEL", legacy_code }))
      );
      if (legacyError) {
        if (salaryText) {
          const { error: salaryRollbackError } = await supabaseAdmin.from("employee_compensations")
            .delete().eq("employee_id", created.id);
          if (salaryRollbackError) return fail("เพิ่มพนักงานแล้วแต่บันทึกรหัสเก่าไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ", 500);
        }
        const { error: rollbackError } = await supabaseAdmin.from("employees").delete().eq("id", created.id);
        if (rollbackError) return fail("เพิ่มพนักงานแล้วแต่บันทึกรหัสเก่าไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ", 500);
        if (createdNewPosition) await supabaseAdmin.from("positions").delete().eq("id", savedPosition.id);
        throw legacyError;
      }
    }
    let initialLogin = null;
    if (createUserAccount) {
      const temporaryPassword = employeeCode;
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      const authEmail = `${employeeCode.toLowerCase()}_${Date.now()}@local.user`;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { employee_code: employeeCode, must_change_password: true },
      });
      if (authError) throw authError;
      createdAuthUserId = authData?.user?.id || null;
      if (!createdAuthUserId) throw new Error("ไม่พบ Auth User ID หลังสร้างบัญชี");

      const { data: account, error: accountError } = await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_user_id: createdAuthUserId,
          employee_id: created.id,
          username: employeeCode,
          password_hash: passwordHash,
          role_id: defaultRole.id,
          is_active: true,
        })
        .select("id")
        .single();
      if (accountError) throw accountError;

      const { error: roadmapError } = await supabaseAdmin.from("rm_user_access").insert({
        employee_id: created.id,
        user_account_id: account.id,
        role: defaultRole.role_code,
      });
      if (roadmapError) throw roadmapError;

      initialLogin = {
        username: employeeCode,
        temporary_password: temporaryPassword,
        must_change_password: true,
      };
    }
    return NextResponse.json({ success: true, data: { ...created, initial_login: initialLogin } }, { status: 201 });
  } catch (error) {
    console.error("Create employee failed", error);
    if (createdEmployeeId) {
      await supabaseAdmin.from("rm_user_access").delete().eq("employee_id", createdEmployeeId);
      await supabaseAdmin.from("user_accounts").delete().eq("employee_id", createdEmployeeId);
      await supabaseAdmin.from("employee_legacy_codes").delete().eq("employee_id", createdEmployeeId);
      await supabaseAdmin.from("employee_compensations").delete().eq("employee_id", createdEmployeeId);
      await supabaseAdmin.from("employees").delete().eq("id", createdEmployeeId);
    }
    if (createdAuthUserId) await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    if (createdNewPositionId) await supabaseAdmin.from("positions").delete().eq("id", createdNewPositionId);
    return fail(
      error?.status === 400 ? error.message : "บันทึกพนักงานไม่สำเร็จ กรุณาตรวจข้อมูลและลองอีกครั้ง",
      error?.status === 400 ? 400 : 500,
    );
  }
}
