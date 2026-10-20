import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/prisma";
import { normalizeSession } from "@/lib/leave-utils";
import { civilDate, dateKey } from "@/lib/leave-policy-calendar";
import { applyApprovedUsage, checkLeave, LeavePolicyError, policyResponse, withEmployeeLock } from "@/lib/leave-policy";
import { getPendingApprovalStep, getNextApprovalStep, recordApprovalStep } from "@/lib/leaveApprovalFlow";
import { sendPushNotification } from "@/lib/pushService";

type Context = { params: { id: string } };
export async function GET(req: NextRequest, { params }: Context) {
  const token = await getTokenPayload();
  if (!token?.employee_id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "invalid leave id" }, { status: 400 });
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ error: "leave not found" }, { status: 404 });
  if (leave.employeeId !== token.employee_id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, data: { ...leave,
    sessionLabel: leave.session === "AM" ? "Morning (Half)" : leave.session === "PM" ? "Afternoon (Half)" : "Full Day" } });
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const token = await getTokenPayload();
    if (!token?.employee_id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new LeavePolicyError("invalid leave id");
    const body = await req.json();
    const initial = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!initial) throw new LeavePolicyError("leave not found", 404);
    const approval = body.status === "APPROVED" || body.status === "REJECTED";
    let isAdmin = false;
    if (approval) {
      const { data: account, error } = await supabaseAdmin.from("user_accounts")
        .select("roles(role_code)").eq("id", token.user_id).maybeSingle();
      if (error) throw new Error("ไม่สามารถตรวจสอบสิทธิ์ผู้อนุมัติได้");
      const role = (account?.roles as unknown as {role_code?: string} | null)?.role_code;
      isAdmin = role === "SUPER_ADMIN" || role === "SYSTEM_ADMIN";
    }
    const conditions: Prisma.LeaveApproverWhereInput[] = [{ employeeId: token.employee_id }];
    if (token.username) conditions.push({ email: token.username });
    if (token.employee_code) conditions.push({ empNo: token.employee_code });
    const approver = approval ? await prisma.leaveApprover.findFirst({ where: { OR: conditions } }) : null;
    const forwardId = body.forwardToApproverId == null ? null : Number(body.forwardToApproverId);
    let nextApproverEmployeeId: string | null = null;
    let forwarded = false;
    let changed = false;
    const result = await withEmployeeLock(initial.employeeId, async (tx) => {
      const leave = await tx.leaveRequest.findUniqueOrThrow({ where: { id } });
      if (approval) {
        if (!isAdmin && (!approver || leave.approverId !== approver.id)) throw new LeavePolicyError("คุณไม่มีสิทธิ์อนุมัติใบลานี้", 403);
        if (leave.status !== "PENDING") {
          if (!forwardId && leave.status === body.status) return leave; // repeat click, never double-deduct
          throw new LeavePolicyError("ใบลานี้ไม่ได้รออนุมัติแล้ว", 409);
        }
        if (forwardId !== null) {
          if (body.status !== "APPROVED" || !Number.isInteger(forwardId) || forwardId <= 0 || forwardId === approver?.id || forwardId === leave.approverId)
            throw new LeavePolicyError("กรุณาเลือกผู้อนุมัติคนถัดไป");
          const next = await tx.leaveApprover.findUnique({ where: { id: forwardId } });
          if (!next) throw new LeavePolicyError("ไม่พบผู้อนุมัติคนถัดไป");
          nextApproverEmployeeId = next.employeeId;
          forwarded = true; changed = true;
          return tx.leaveRequest.update({ where: { id }, data: {
            approverId: forwardId, approverReason: body.approverReason?.trim() || "อนุมัติและส่งต่อ",
            status: "PENDING", approvedAt: null,
          } });
        }
        let reservation = leave.reservation;
        if (body.status === "APPROVED") {
          const checked = await checkLeave(tx, { employeeId: leave.employeeId, kind: leave.kind,
            startDate: dateKey(leave.startDate), endDate: dateKey(leave.endDate), session: leave.session || "FULL", excludeLeaveId: id });
          if (Math.abs(checked.requestedDays - Number(leave.requestedDays)) > 0.001)
            throw new LeavePolicyError("จำนวนวันในใบลาเก่าไม่ตรงกับรายละเอียด กรุณาตรวจแก้ก่อนอนุมัติ", 409);
          reservation = checked.reservation as unknown as Prisma.JsonValue;
          await applyApprovedUsage(tx, leave.employeeId, leave.kind, checked.reservation);
        }
        changed = true;
        return tx.leaveRequest.update({ where: { id }, data: {
          status: body.status, approverReason: body.approverReason || null,
          approverSignature: body.approverSignature || null,
          approvedAt: body.status === "APPROVED" ? new Date() : null,
          reservation: reservation === null ? Prisma.DbNull : reservation as Prisma.InputJsonValue,
        } });
      }
      if (leave.employeeId !== token.employee_id) throw new LeavePolicyError("forbidden", 403);
      if (leave.status !== "PENDING") throw new LeavePolicyError("แก้ไขหรือยกเลิกได้เฉพาะใบลารออนุมัติ", 409);
      const action = String(body.action || "").toUpperCase();
      if (body.status === "CANCELLED" || action === "CANCEL" || action === "CANCELLED") {
        changed = true;
        return tx.leaveRequest.update({ where: { id }, data: { status: "CANCELLED", approvedAt: null } });
      }
      if (!body.kind || !body.startDate || !body.endDate || !body.reason?.trim())
        throw new LeavePolicyError("กรุณาระบุประเภท วันลา และเหตุผลให้ครบ");
      const startDate = dateKey(String(body.startDate));
      const endDate = dateKey(String(body.endDate));
      const session = normalizeSession(body.sessionLabel);
      const approverId = Number(body.approverId);
      if (!Number.isInteger(approverId) || approverId <= 0 || !await tx.leaveApprover.findUnique({ where: { id: approverId } }))
        throw new LeavePolicyError("กรุณาเลือกผู้อนุมัติ");
      const checked = await checkLeave(tx, { employeeId: leave.employeeId, kind: body.kind, startDate, endDate, session, excludeLeaveId: id });
      changed = true;
      return tx.leaveRequest.update({ where: { id }, data: {
        kind: body.kind, startDate: civilDate(startDate), endDate: civilDate(endDate), session,
        reason: body.reason.trim(), contact: body.contact || null, handoverTo: body.handoverTo || null,
        attachmentUrl: body.attachmentUrl || null, approverId, requestedDays: checked.requestedDays,
        reservation: checked.reservation as unknown as Prisma.InputJsonValue, approvedAt: null,
      } });
    });
    if (approval && approver && changed) {
      // Keep the existing approval-step history and notification workflow.
      try {
        const pending = await getPendingApprovalStep(id, approver.id);
        const step = pending ?? await getNextApprovalStep(id);
        await recordApprovalStep({ leaveRequestId: id, stepOrder: step, approverId: approver.id,
          status: body.status, note: body.approverReason || null });
        if (forwarded && forwardId) await recordApprovalStep({ leaveRequestId: id, stepOrder: step + 1,
          approverId: forwardId, status: "PENDING" });
      } catch (error) { console.error("Leave committed; approval history failed:", error); }
      try {
        const receiver = forwarded ? nextApproverEmployeeId : result.employeeId;
        if (receiver) await sendPushNotification(receiver, {
          title: forwarded ? "มีคำขอลารออนุมัติขั้นถัดไป" : body.status === "APPROVED" ? "คำขอลาได้รับการอนุมัติแล้ว" : "คำขอลาไม่ได้รับการอนุมัติ",
          body: `${Number(result.requestedDays)} วัน${body.approverReason ? ` (${body.approverReason})` : ""}`,
          url: forwarded ? "/?tab=approvals" : "/?tab=history",
        });
      } catch (error) { console.warn("Leave committed; push notification failed:", error); }
    }
    return NextResponse.json(forwarded ? { ok: true, forwarded: true } : approval ? result : { ok: true, data: result });
  } catch (error) {
    console.error("PATCH /api/leaves/[id]:", error);
    const result = policyResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
