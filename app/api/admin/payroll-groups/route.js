import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
 * Helper
 * ========================================================= */

function mapPayrollGroup(item) {
  return {
    id: item.id,

    payroll_group_code: item.payroll_group_code,
    payroll_group_name: item.payroll_group_name,

    payroll_company_id: item.payroll_company_id,

    payroll_company:
      item.payroll_companies || null,

    description:
      item.description || "",

    payment_day:
      item.payment_day,

    cutoff_end_day:
      item.cutoff_end_day,

    payment_frequency:
      item.payment_frequency,

    payment_offset_month:
      item.payment_offset_month,

    status:
      item.status,

    sort_order:
      item.sort_order,

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
}

/* =========================================================
 * GET
 * ========================================================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams.get("status") || "";

    const all =
      searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("payroll_groups")
      .select(
        `
        *,
        payroll_companies (
          id,
          payroll_company_code,
          payroll_company_name
        )
      `,
        {
          count: "exact",
        }
      );

    /* =========================
       Search
    ========================= */

    if (search) {
      query = query.or(
        [
          `payroll_group_code.ilike.%${search}%`,
          `payroll_group_name.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* =========================
       Status
    ========================= */

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    query = query.order(
      "sort_order",
      {
        ascending: true,
      }
    );

    query = query.order(
      "payroll_group_code",
      {
        ascending: true,
      }
    );

    /* =========================
       All
    ========================= */

    if (all) {
      const {
        data,
        error,
      } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data.map(
          mapPayrollGroup
        ),
      });
    }

    /* =========================
       Pagination
    ========================= */

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    const {
      data,
      count,
      error,
    } = await query.range(
      from,
      to
    );

    if (error) throw error;

    /* =========================
       Summary
    ========================= */

    const summaryQuery =
      supabaseAdmin
        .from("payroll_groups")
        .select(
          "status",
          {
            count: "exact",
            head: false,
          }
        );

    const {
      data: summaryRows,
    } = await summaryQuery;

    const summary = {
      total:
        summaryRows?.length || 0,

      active:
        summaryRows?.filter(
          (x) =>
            x.status === "active"
        ).length || 0,

      inactive:
        summaryRows?.filter(
          (x) =>
            x.status === "inactive"
        ).length || 0,
    };

    return NextResponse.json({
      success: true,

      data:
        data.map(
          mapPayrollGroup
        ),

      summary,

      pagination: {
        page,

        pageSize,

        total:
          count || 0,

        totalPages: Math.ceil(
          (count || 0) /
            pageSize
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET Payroll Groups Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
 * POST
 * ========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    /* =========================
       Payload
    ========================= */

    const payload = {
      payroll_group_code:
        body?.payroll_group_code
          ?.trim()
          ?.toUpperCase(),

      payroll_group_name:
        body?.payroll_group_name
          ?.trim(),

      payroll_company_id:
        body?.payroll_company_id ||
        null,

      description:
        body?.description?.trim() ||
        null,

      payment_day:
        body?.payment_day || null,

      cutoff_end_day:
        body?.cutoff_end_day ||
        null,

      payment_frequency:
        body?.payment_frequency ||
        "monthly",

      payment_offset_month:
        Number(
          body?.payment_offset_month ??
            0
        ),

      status:
        body?.status || "active",

      sort_order:
        Number(
          body?.sort_order ?? 0
        ),
    };

    /* =========================
       Validation
    ========================= */

    if (!payload.payroll_group_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสกลุ่มเงินเดือน",
        },
        { status: 400 }
      );
    }

    if (!payload.payroll_group_name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อกลุ่มเงินเดือน",
        },
        { status: 400 }
      );
    }

    if (!payload.payroll_company_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกบริษัทเงินเดือน",
        },
        { status: 400 }
      );
    }

    /* =========================
       Duplicate Code
    ========================= */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("payroll_groups")
      .select("id")
      .eq(
        "payroll_group_code",
        payload.payroll_group_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสกลุ่มเงินเดือนนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* =========================
       Duplicate Name
    ========================= */

    const {
      data: duplicateName,
    } = await supabaseAdmin
      .from("payroll_groups")
      .select("id")
      .eq(
        "payroll_group_name",
        payload.payroll_group_name
      )
      .eq(
        "payroll_company_id",
        payload.payroll_company_id
      )
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อกลุ่มเงินเดือนนี้มีอยู่แล้วในบริษัท",
        },
        { status: 400 }
      );
    }

    /* =========================
       Insert
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payroll_groups")
      .insert(payload)
      .select(
        `
        *,
        payroll_companies (
          id,
          payroll_company_code,
          payroll_company_name
        )
      `
      )
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    try {
      await writeActivityLog({
        module_name:
          "Payroll Groups",

        action_type:
          "CREATE",

        reference_table:
          "payroll_groups",

        reference_id:
          data.id,

        description: `สร้างกลุ่มเงินเดือน ${data.payroll_group_code} : ${data.payroll_group_name}`,

        old_data: null,

        new_data: data,
      });
    } catch (logError) {
      console.error(
        "Activity Log Error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "สร้างกลุ่มเงินเดือนสำเร็จ",

      data:
        mapPayrollGroup(data),
    });
  } catch (error) {
    console.error(
      "POST Payroll Groups Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}
