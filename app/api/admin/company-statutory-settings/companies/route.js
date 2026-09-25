import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

function cleanText(value) {
  return String(value || "").trim();
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.company_statutory_settings",
      "view",
      { scopeType: "company" }
    );

    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const search = cleanText(searchParams.get("search"));
    const status = cleanText(searchParams.get("status"));

    let query = supabaseAdmin.from("companies").select(`
      id,
      company_code,
      company_name_th,
      company_name_en,
      tax_id,
      branch_no,
      status
    `);

    query = guard.applyScope(query, "id");

    if (search) {
      query = query.or(
        [
          `company_code.ilike.%${search}%`,
          `company_name_th.ilike.%${search}%`,
          `company_name_en.ilike.%${search}%`,
          `tax_id.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (status) query = query.eq("status", status);

    query = query.order("company_code", { ascending: true }).limit(1000);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("GET_COMPANY_STATUTORY_COMPANIES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถโหลด Company Master ได้",
      },
      { status: 500 }
    );
  }
}
