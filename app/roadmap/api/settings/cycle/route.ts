import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const DEFAULT_SETTINGS = {
  nomination_alert_start_day: 26,
  nomination_alert_end_day: 27,
  nomination_start_day: 26,
  nomination_end_day: 28,
  hr_prepare_deadline_day: 2,
  evaluation_alert_start_day: 6,
  evaluation_alert_end_day: 7,
  manager_lock_day: 9,
};

function normalizeDay(value: unknown, fallback: number) {
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 31) return fallback;
  return day;
}

async function getOrCreateCycleSettings() {
  const { data, error } = await supabaseAdmin
    .from("rm_cycle_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabaseAdmin
    .from("rm_cycle_settings")
    .insert([DEFAULT_SETTINGS])
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

export async function GET() {
  try {
    const data = await getOrCreateCycleSettings();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Load roadmap cycle settings failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load roadmap cycle settings failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const current = await getOrCreateCycleSettings();
    const body = await req.json();

    const payload = {
      nomination_alert_start_day: normalizeDay(
        body.nomination_alert_start_day,
        current.nomination_alert_start_day,
      ),
      nomination_alert_end_day: normalizeDay(
        body.nomination_alert_end_day,
        current.nomination_alert_end_day,
      ),
      nomination_start_day: normalizeDay(
        body.nomination_start_day,
        current.nomination_start_day,
      ),
      nomination_end_day: normalizeDay(
        body.nomination_end_day,
        current.nomination_end_day,
      ),
      hr_prepare_deadline_day: normalizeDay(
        body.hr_prepare_deadline_day,
        current.hr_prepare_deadline_day,
      ),
      evaluation_alert_start_day: normalizeDay(
        body.evaluation_alert_start_day,
        current.evaluation_alert_start_day,
      ),
      evaluation_alert_end_day: normalizeDay(
        body.evaluation_alert_end_day,
        current.evaluation_alert_end_day,
      ),
      manager_lock_day: normalizeDay(
        body.manager_lock_day,
        current.manager_lock_day,
      ),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("rm_cycle_settings")
      .update(payload)
      .eq("id", current.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Update roadmap cycle settings failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Update roadmap cycle settings failed",
      },
      { status: 500 },
    );
  }
}