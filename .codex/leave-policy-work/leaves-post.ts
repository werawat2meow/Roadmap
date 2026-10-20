export async function POST(req: NextRequest) {
  try {
    const token = await getTokenPayload();
    if (!token?.employee_id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json();
    const kind = body.kind;
    const startDate = dateKey(String(body.startDate || ""));
    const endDate = dateKey(String(body.endDate || ""));
    if (!body.reason?.trim()) throw new LeavePolicyError("กรุณาระบุเหตุผลการลา");
    const approverId = Number(body.approverId);
    if (!Number.isInteger(approverId) || approverId <= 0) throw new LeavePolicyError("กรุณาเลือกผู้อนุมัติ");
    const session = normalizeSession(body.sessionLabel);
    const saved = await withEmployeeLock(token.employee_id, async (tx) => {
      const approver = await tx.leaveApprover.findUnique({ where: { id: approverId } });
      if (!approver) throw new LeavePolicyError("ไม่พบผู้อนุมัติ");
      const checked = await checkLeave(tx, { employeeId: token.employee_id, kind, startDate, endDate, session });
      return tx.leaveRequest.create({ data: {
        employeeId: token.employee_id, approverId, kind, startDate: civilDate(startDate), endDate: civilDate(endDate),
        session, reason: body.reason.trim(), contact: body.contact || null, handoverTo: body.handoverTo || null,
        attachmentUrl: body.attachmentUrl || null, requestedDays: checked.requestedDays,
        reservation: checked.reservation as unknown as Prisma.InputJsonValue, status: "PENDING",
      } });
    });
    try {
      const approver = await prisma.leaveApprover.findUnique({ where: { id: approverId }, select: { employeeId: true } });
      const employee = await getEmployeeByUuid(token.employee_id);
      if (approver?.employeeId) await sendPushNotification(approver.employeeId, {
        title: "มีคำขอลาใหม่", body: `${employee?.first_name_th || token.employee_code || "พนักงาน"} ยื่นลา ${Number(saved.requestedDays)} วัน`,
        url: "/?tab=approvals",
      });
    } catch (error) { console.warn("Leave saved; push notification failed:", error); }
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    const result = policyResponse(error);
    console.error("POST /api/leaves:", error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

// Keep the legacy URL, but use the exact same final-approval implementation.
export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: "invalid leave id" }, { status: 400 });
  return patchLeave(req, { params: { id } });
}
