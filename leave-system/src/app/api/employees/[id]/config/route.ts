import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/prisma";

async function jsonError(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenPayload();
    if (!token) return jsonError("Unauthorized", 401);

    const employeeId = params.id;

    const [config, approverLinks, selfApprover, availableApprovers] = await Promise.all([
      prisma.leaveEmployeeConfig.findUnique({ where: { employeeId } }),
      prisma.leaveEmployeeApprover.findMany({
        where: { employeeId },
        include: { approver: true },
      }),
      prisma.leaveApprover.findUnique({ where: { employeeId } }),
      prisma.leaveApprover.findMany({ where: { employeeId: { not: employeeId } } }),
    ]);

    return NextResponse.json({
      weeklyHoliday: config?.weeklyHoliday ?? null,
      carryForwardAnnual: Number(config?.carryForwardAnnual ?? 0),
      carryForwardHoliday: Number(config?.carryForwardHoliday ?? 0),
      isApprover: !!selfApprover,
      assignedApprovers: approverLinks.map((l) => ({
        id: l.approver.id,
        empNo: l.approver.empNo,
        firstNameTh: l.approver.firstNameTh,
        lastNameTh: l.approver.lastNameTh,
      })),
      availableApprovers: availableApprovers.map((a) => ({
        id: a.id,
        empNo: a.empNo,
        firstNameTh: a.firstNameTh,
        lastNameTh: a.lastNameTh,
      })),
    });
  } catch (err: any) {
    console.error("GET /config error:", err);
    return jsonError(err?.message ?? "Internal error");
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenPayload();
    if (!token) return jsonError("Unauthorized", 401);

    const employeeId = params.id;

    let payload: any = null;
    try {
      payload = await req.json();
    } catch (parseErr) {
      console.error("POST /config JSON parse error:", parseErr);
      return jsonError("Invalid JSON payload", 400);
    }

    console.info("POST /config payload:", { employeeId, payload });

    const {
      weeklyHoliday,
      carryForwardAnnual,
      carryForwardHoliday,
      approverIds,
      isApprover,
    } = payload ?? {};

    if (approverIds && !Array.isArray(approverIds)) {
      return jsonError("approverIds must be an array", 400);
    }

    let empData: { employee_code: string; first_name_th: string; last_name_th: string } | null = null;
    if (isApprover === true) {
      const { data, error } = await supabaseAdmin
        .from("employees")
        .select("employee_code, first_name_th, last_name_th")
        .eq("id", employeeId)
        .single();

      if (error) {
        console.error("Supabase fetch employee error:", error);
        return jsonError("Failed to fetch employee info from Supabase: " + error.message, 502);
      }
      if (!data) {
        return jsonError("Employee not found in Supabase", 404);
      }
      empData = data;
    }

    await prisma.$transaction(async (tx) => {
      await tx.leaveEmployeeConfig.upsert({
        where: { employeeId },
        create: {
          employeeId,
          weeklyHoliday,
          carryForwardAnnual: carryForwardAnnual ?? 0,
          carryForwardHoliday: carryForwardHoliday ?? 0,
        },
        update: {
          weeklyHoliday,
          carryForwardAnnual: carryForwardAnnual ?? 0,
          carryForwardHoliday: carryForwardHoliday ?? 0,
        },
      });

      if (isApprover === true && empData) {
        await tx.leaveApprover.upsert({
          where: { employeeId },
          create: {
            employeeId,
            empNo: empData.employee_code,
            firstNameTh: empData.first_name_th,
            lastNameTh: empData.last_name_th,
          },
          update: {},
        });
      } else if (isApprover === false) {
        await tx.leaveApprover.deleteMany({ where: { employeeId } });
      }

      if (Array.isArray(approverIds)) {
        await tx.leaveEmployeeApprover.deleteMany({ where: { employeeId } });
        if (approverIds.length > 0) {
          const rows = approverIds.map((id: any) => ({ employeeId, approverId: Number(id) }));
          await tx.leaveEmployeeApprover.createMany({ data: rows, skipDuplicates: true });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /config error:", err?.stack ?? err);
    return jsonError(err?.message ?? "Internal error");
  }
}