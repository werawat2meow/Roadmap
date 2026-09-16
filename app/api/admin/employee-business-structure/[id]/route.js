import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  createActionGuard,
  jsonError,
  loadEmployeeById,
  assertEmployeeInScope,
  normalizeAssignmentInput,
  validateAssignmentInput,
  assertManagementScopesAllowed,
  validateSupervisorRelationship,
  validateEmployeeLevel,
  buildAssignmentPayload,
  buildScopeRows,
  readAssignmentById,
  mapBusinessStructureRow,
  getDatabaseErrorStatus,
} from "../_helpers";

async function loadScopeRows(assignmentId) {
  const { data, error } = await supabaseAdmin
    .from("management_assignment_scopes")
    .select("*")
    .eq("management_assignment_id", assignmentId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

function assignmentBackup(raw) {
  return {
    employee_id: raw?.employee_id || null,
    management_level: raw?.management_level || null,
    scope_type: raw?.scope_type || null,
    company_id: raw?.company_id || null,
    branch_group_id: raw?.branch_group_id || null,
    branch_id: raw?.branch_id || null,
    department_id: raw?.department_id || null,
    division_id: raw?.division_id || null,
    unit_id: raw?.unit_id || null,
    supervisor_employee_id: raw?.supervisor_employee_id || null,
    is_primary: raw?.is_primary ?? true,
    status: raw?.status || "active",
    sort_order: Number(raw?.sort_order || 0),
  };
}

function scopeBackupRows(rows = []) {
  return rows.map((row) => ({
    management_assignment_id: row.management_assignment_id,
    scope_type: row.scope_type,
    company_id: row.company_id || null,
    branch_group_id: row.branch_group_id || null,
    branch_id: row.branch_id || null,
    department_id: row.department_id || null,
    division_id: row.division_id || null,
    unit_id: row.unit_id || null,
    is_primary: Boolean(row.is_primary),
    status: row.status || "active",
    sort_order: Number(row.sort_order || 0),
  }));
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const guard = await createActionGuard("view", "employee");
    if (!guard.ok) return guard.response;

    const raw = await readAssignmentById(id);
    if (!raw) return jsonError("ไม่พบโครงสร้างบริหารพนักงาน", 404);

    const employee = await loadEmployeeById(raw.employee_id);
    const scopeError = assertEmployeeInScope(
      guard,
      employee,
      "คุณไม่มีสิทธิ์ดูโครงสร้างบริหารรายการนี้"
    );
    if (scopeError) return scopeError;

    return NextResponse.json({
      success: true,
      data: mapBusinessStructureRow(raw, employee),
    });
  } catch (error) {
    console.error("GET_EMPLOYEE_BUSINESS_STRUCTURE_BY_ID_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถโหลดรายละเอียดโครงสร้างบริหารได้",
      500
    );
  }
}

export async function PATCH(req, { params }) {
  let oldRaw = null;
  let oldScopes = [];
  let assignmentUpdated = false;
  let scopesReplaced = false;

  try {
    const { id } = await params;

    const guard = await createActionGuard("edit", "employee");
    if (!guard.ok) return guard.response;

    oldRaw = await readAssignmentById(id);
    if (!oldRaw) return jsonError("ไม่พบโครงสร้างบริหารพนักงาน", 404);

    const employee = await loadEmployeeById(oldRaw.employee_id);
    const employeeScopeError = assertEmployeeInScope(
      guard,
      employee,
      "คุณไม่มีสิทธิ์แก้ไขโครงสร้างบริหารของพนักงานรายนี้"
    );
    if (employeeScopeError) return employeeScopeError;

    const body = await req.json();
    const input = normalizeAssignmentInput({
      ...body,
      employee_id: oldRaw.employee_id,
    });

    const basicError = validateAssignmentInput(input);
    if (basicError) return jsonError(basicError, 400);

    const levelError = await validateEmployeeLevel(
      employee,
      input.managementLevel
    );
    if (levelError) return jsonError(levelError, 400);

    const scopeAccessError = await assertManagementScopesAllowed(
      "edit",
      input.scopes
    );
    if (scopeAccessError) return scopeAccessError;

    const supervisorError = await validateSupervisorRelationship(input);
    if (supervisorError) return jsonError(supervisorError, 400);

    oldScopes = await loadScopeRows(id);
    const oldMapped = mapBusinessStructureRow(oldRaw, employee);

    const assignmentPayload = buildAssignmentPayload(input);
    delete assignmentPayload.employee_id;

    const { error: updateError } = await supabaseAdmin
      .from("management_assignments")
      .update({
        ...assignmentPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;
    assignmentUpdated = true;

    const { error: deleteScopesError } = await supabaseAdmin
      .from("management_assignment_scopes")
      .delete()
      .eq("management_assignment_id", id);

    if (deleteScopesError) throw deleteScopesError;
    scopesReplaced = true;

    const newScopeRows = buildScopeRows(id, input.scopes);
    const { error: insertScopesError } = await supabaseAdmin
      .from("management_assignment_scopes")
      .insert(newScopeRows);

    if (insertScopesError) throw insertScopesError;

    const raw = await readAssignmentById(id);
    const mapped = mapBusinessStructureRow(raw, employee);

    await writeActivityLog({
      module_name: "employee_business_structure",
      action_type: "update",
      reference_table: "management_assignments",
      reference_id: id,
      description: `แก้ไขโครงสร้างบริหาร ${mapped.employee_name}`,
      old_data: oldMapped,
      new_data: mapped,
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขโครงสร้างบริหารพนักงานเรียบร้อยแล้ว",
      data: mapped,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);

    if (oldRaw && assignmentUpdated) {
      const { error: restoreAssignmentError } = await supabaseAdmin
        .from("management_assignments")
        .update({
          ...assignmentBackup(oldRaw),
          updated_at: oldRaw.updated_at || new Date().toISOString(),
        })
        .eq("id", oldRaw.id);

      if (restoreAssignmentError) {
        console.error(
          "RESTORE_EMPLOYEE_BUSINESS_STRUCTURE_ASSIGNMENT_ERROR:",
          restoreAssignmentError
        );
      }
    }

    if (oldRaw && scopesReplaced) {
      await supabaseAdmin
        .from("management_assignment_scopes")
        .delete()
        .eq("management_assignment_id", oldRaw.id);

      if (oldScopes.length) {
        const { error: restoreScopesError } = await supabaseAdmin
          .from("management_assignment_scopes")
          .insert(scopeBackupRows(oldScopes));

        if (restoreScopesError) {
          console.error(
            "RESTORE_EMPLOYEE_BUSINESS_STRUCTURE_SCOPES_ERROR:",
            restoreScopesError
          );
        }
      }
    }

    return jsonError(
      error?.message || "ไม่สามารถแก้ไขโครงสร้างบริหารพนักงานได้",
      getDatabaseErrorStatus(error)
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const guard = await createActionGuard("delete", "employee");
    if (!guard.ok) return guard.response;

    const raw = await readAssignmentById(id);
    if (!raw) return jsonError("ไม่พบโครงสร้างบริหารพนักงาน", 404);

    const employee = await loadEmployeeById(raw.employee_id);
    const employeeScopeError = assertEmployeeInScope(
      guard,
      employee,
      "คุณไม่มีสิทธิ์ยกเลิกโครงสร้างบริหารของพนักงานรายนี้"
    );
    if (employeeScopeError) return employeeScopeError;

    const { data: subordinate, error: subordinateError } = await supabaseAdmin
      .from("management_assignments")
      .select("id, employee_id")
      .eq("supervisor_employee_id", raw.employee_id)
      .eq("status", "active")
      .neq("id", id)
      .limit(1)
      .maybeSingle();

    if (subordinateError) throw subordinateError;

    if (subordinate) {
      return jsonError(
        "ไม่สามารถยกเลิกรายการนี้ได้ เนื่องจากพนักงานยังเป็นผู้บังคับบัญชาของพนักงานอื่น กรุณาปรับ Reporting Line ของผู้ใต้บังคับบัญชาก่อน",
        409
      );
    }

    const mapped = mapBusinessStructureRow(raw, employee);

    const { error } = await supabaseAdmin
      .from("management_assignments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "employee_business_structure",
      action_type: "delete",
      reference_table: "management_assignments",
      reference_id: id,
      description: `ยกเลิกโครงสร้างบริหาร ${mapped.employee_name}`,
      old_data: mapped,
    });

    return NextResponse.json({
      success: true,
      message: "ยกเลิกโครงสร้างบริหารพนักงานเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถยกเลิกโครงสร้างบริหารพนักงานได้",
      getDatabaseErrorStatus(error)
    );
  }
}
