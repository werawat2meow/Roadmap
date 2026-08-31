import { prisma } from "@/lib/prisma";

type ViewerMode = "ADMIN" | "SCOPED";
type ScopeNames = "org" | "department" | "division" | "unit";

export type ApprovalViewerContext = {
  userId: number;
  email: string;
  role: string;
  viewerMode: ViewerMode;
  approverId: number | null;
  scopes: ScopeNames[];
  assignedEmployeeIds: string[];
};

function isAdminRole(role?: string) {
  return role === "ADMIN" || role === "MASTER_ADMIN";
}

export async function getApprovalViewerContext(
  email: string,
  role: string,
  empNo?: string
): Promise<ApprovalViewerContext> {
  if (isAdminRole(role)) {
    return {
      userId: 0,
      email,
      role,
      viewerMode: "ADMIN",
      approverId: null,
      scopes: ["org", "department", "division", "unit"],
      assignedEmployeeIds: [],
    };
  }

  const approver = await prisma.leaveApprover.findFirst({
    where: {
      OR: [{ email }, ...(empNo ? [{ empNo }] : [])],
    },
    select: {
      id: true,
      branchId: true,
      departmentId: true,
      divisionId: true,
      unitId: true,
    },
  });

  if (!approver) {
    return {
      userId: 0,
      email,
      role,
      viewerMode: "SCOPED",
      approverId: null,
      scopes: [],
      assignedEmployeeIds: [],
    };
  }

  const assignments = await prisma.leaveEmployeeApprover.findMany({
    where: { approverId: approver.id },
    select: { employeeId: true },
  });

  const scopes: ScopeNames[] = [];
  if (approver.branchId) scopes.push("org");
  if (approver.departmentId) scopes.push("department");
  if (approver.divisionId) scopes.push("division");
  if (approver.unitId) scopes.push("unit");

  return {
    userId: 0,
    email,
    role,
    viewerMode: "SCOPED",
    approverId: approver.id,
    scopes,
    assignedEmployeeIds: assignments.map((a) => a.employeeId),
  };
}

export async function canViewerAccessEmployee(
  email: string,
  employeeId: string,   // เปลี่ยนจาก number
  role: string,
  empNo?: string
) {
  const ctx = await getApprovalViewerContext(email, role, empNo);
  if (ctx.viewerMode === "ADMIN") return true;
  if (!ctx.approverId) return false;

  const assigned = await prisma.leaveEmployeeApprover.findFirst({
    where: {
      approverId: ctx.approverId,
      employeeId: employeeId,  // ไม่ต้อง String() แล้ว
    },
    select: { id: true },
  });

  return !!assigned;
}