import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const SELECT_FIELDS = `
  id,
  prefix,
  annualLeaveDays,
  holidayLeaveDays,
  vacationLeaveDays,
  businessLeaveDays,
  sickLeaveDays,
  ordainLeaveDays,
  maternityLeaveDays,
  unpaidLeaveDays,
  birthdayLeaveDays
`;

function toInt(value: unknown, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function buildPayload(body: any) {
  return {
    prefix: String(body.prefix || "").trim(),
    annualLeaveDays: toInt(body.annualLeaveDays),
    holidayLeaveDays: toInt(body.holidayLeaveDays),
    vacationLeaveDays: toInt(body.vacationLeaveDays),
    businessLeaveDays: toInt(body.businessLeaveDays),
    sickLeaveDays: toInt(body.sickLeaveDays),
    ordainLeaveDays: toInt(body.ordainLeaveDays),
    maternityLeaveDays: toInt(body.maternityLeaveDays),
    unpaidLeaveDays: toInt(body.unpaidLeaveDays),
    birthdayLeaveDays: toInt(body.birthdayLeaveDays),
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("leave_rights_templates")
      .select(SELECT_FIELDS)
      .order("id", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error("Load leave entitlements failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load leave entitlements failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload.prefix) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ Level P" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leave_rights_templates")
      .insert(payload)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Create leave entitlement failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Create leave entitlement failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing entitlement id" },
        { status: 400 },
      );
    }

    const payload = buildPayload(body);

    if (!payload.prefix) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ Level P" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leave_rights_templates")
      .update(payload)
      .eq("id", Number(id))
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Update leave entitlement failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Update leave entitlement failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing entitlement id" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("leave_rights_templates")
      .delete()
      .eq("id", Number(id));

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Delete leave entitlement failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Delete leave entitlement failed",
      },
      { status: 500 },
    );
  }
}