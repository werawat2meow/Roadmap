import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const TARGET_TYPES = ["ORG", "DEPARTMENT", "DIVISION", "UNIT"];

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("leave_blackouts")
    .select(`
      id,
      startDate,
      endDate,
      reason,
      active,
      allKinds,
      createdAt,
      leave_blackout_targets (
        id,
        targetType,
        targetId
      ),
      leave_blackout_kinds (
        kind
      )
    `)
    .order("startDate", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: (data || []).map((item: any) => ({
      id: item.id,
      startDate: String(item.startDate).slice(0, 10),
      endDate: String(item.endDate).slice(0, 10),
      reason: item.reason || "",
      active: item.active,
      allKinds: item.allKinds,
      targets: item.leave_blackout_targets || [],
      blockedKinds: (item.leave_blackout_kinds || []).map(
        (kind: any) => kind.kind,
      ),
    })),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      startDate,
      endDate,
      reason,
      active = true,
      allKinds = true,
      targets = [],
      blockedKinds = [],
    } = body;

    if (!startDate || !endDate || endDate < startDate) {
      return NextResponse.json(
        { success: false, error: "ช่วงวันที่ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (!reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุเหตุผล" },
        { status: 400 },
      );
    }

    const validTargets = targets.filter(
      (target: any) =>
        TARGET_TYPES.includes(target.targetType) && target.targetId,
    );

    if (validTargets.length === 0) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสังกัด แผนก ฝ่าย หรือหน่วย" },
        { status: 400 },
      );
    }

    if (!allKinds && blockedKinds.length === 0) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกประเภทการลาที่ต้องการล็อค" },
        { status: 400 },
      );
    }

    const { data: blackout, error: blackoutError } = await supabaseAdmin
      .from("leave_blackouts")
      .insert({
        startDate,
        endDate,
        reason: reason.trim(),
        active,
        allKinds,
      })
      .select("id")
      .single();

    if (blackoutError) throw blackoutError;

    const targetRows = validTargets.map((target: any) => ({
      blackoutId: blackout.id,
      targetType: target.targetType,
      targetId: target.targetId,
    }));

    const { error: targetError } = await supabaseAdmin
      .from("leave_blackout_targets")
      .insert(targetRows);

    if (targetError) throw targetError;

    if (!allKinds) {
      const kindRows = blockedKinds.map((kind: string) => ({
        blackoutId: blackout.id,
        kind,
      }));

      const { error: kindError } = await supabaseAdmin
        .from("leave_blackout_kinds")
        .insert(kindRows);

      if (kindError) throw kindError;
    }

    return NextResponse.json({
      success: true,
      id: blackout.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "บันทึกช่วงปิดวันลาไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "ไม่พบรหัสรายการ" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("leave_blackouts")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}