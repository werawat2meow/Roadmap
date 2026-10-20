import { supabaseAdmin } from "@/lib/supabaseServer";

export async function findLeaveBlackoutConflict(params: {
  employeeId: string;
  kind: string;
  startDate: string;
  endDate: string;
}) {
  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("branch_id, department_id, division_id, unit_id")
    .eq("id", params.employeeId)
    .single();

  if (!employee) return null;

  const targets = [
    { targetType: "ORG", targetId: employee.branch_id },
    { targetType: "DEPARTMENT", targetId: employee.department_id },
    { targetType: "DIVISION", targetId: employee.division_id },
    { targetType: "UNIT", targetId: employee.unit_id },
  ].filter((item) => item.targetId);

  const { data: blackouts, error } = await supabaseAdmin
    .from("leave_blackouts")
    .select(`
      id,
      startDate,
      endDate,
      reason,
      allKinds,
      leave_blackout_targets (
        targetType,
        targetId
      ),
      leave_blackout_kinds (
        kind
      )
    `)
    .eq("active", true)
    .lte("startDate", params.endDate)
    .gte("endDate", params.startDate);

  if (error) throw error;

  for (const blackout of blackouts || []) {
    const targetMatched = blackout.leave_blackout_targets?.some(
      (target: any) =>
        targets.some(
          (employeeTarget) =>
            employeeTarget.targetType === target.targetType &&
            employeeTarget.targetId === target.targetId,
        ),
    );

    const kindMatched =
      blackout.allKinds ||
      blackout.leave_blackout_kinds?.some(
        (item: any) => item.kind === params.kind,
      );

    if (targetMatched && kindMatched) {
      return blackout;
    }
  }

  return null;
}