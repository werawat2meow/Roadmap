import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   Helper : Build Summary
========================================================= */

async function getSummary() {
  const [
    totalResult,
    activeResult,
    payrollResult,
    bankTransferResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("payment_methods")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabaseAdmin
      .from("payment_methods")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabaseAdmin
      .from("payment_methods")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("supports_payroll", true),

    supabaseAdmin
      .from("payment_methods")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "payment_type",
        "bank_transfer"
      ),
  ]);

  return {
    total:
      totalResult.count || 0,

    active:
      activeResult.count || 0,

    payroll:
      payrollResult.count || 0,

    bankTransfer:
      bankTransferResult.count || 0,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const all =
      searchParams.get("all") ===
      "true";

    const search =
      searchParams.get("search") ||
      "";

    const status =
      searchParams.get("status") ||
      "";

    const paymentType =
      searchParams.get(
        "payment_type"
      ) || "";

    const supportsPayroll =
      searchParams.get(
        "supports_payroll"
      );

    const supportsBenefit =
      searchParams.get(
        "supports_benefit"
      );

    const supportsExpense =
      searchParams.get(
        "supports_expense"
      );

    const page =
      Number(
        searchParams.get("page")
      ) || 1;

    const pageSize =
      Number(
        searchParams.get(
          "pageSize"
        )
      ) || 20;

    let query = supabaseAdmin
      .from("payment_methods")
      .select("*", {
        count: "exact",
      });

    /* ===========================
       Search
    =========================== */

    if (search) {
      query = query.or(
        [
          `payment_method_code.ilike.%${search}%`,
          `payment_method_name.ilike.%${search}%`,
          `payment_method_name_en.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* ===========================
       Filters
    =========================== */

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    if (paymentType) {
      query = query.eq(
        "payment_type",
        paymentType
      );
    }

    if (
      supportsPayroll !== null
    ) {
      query = query.eq(
        "supports_payroll",
        supportsPayroll ===
          "true"
      );
    }

    if (
      supportsBenefit !== null
    ) {
      query = query.eq(
        "supports_benefit",
        supportsBenefit ===
          "true"
      );
    }

    if (
      supportsExpense !== null
    ) {
      query = query.eq(
        "supports_expense",
        supportsExpense ===
          "true"
      );
    }
        /* ===========================
       All
    =========================== */

    if (all) {
      query = query
        .order("sort_order", {
          ascending: true,
        })
        .order(
          "payment_method_code",
          {
            ascending: true,
          }
        );

      const { data, error } =
        await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /* ===========================
       Sorting
    =========================== */

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order(
        "payment_method_code",
        {
          ascending: true,
        }
      );

    /* ===========================
       Pagination
    =========================== */

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    query = query.range(
      from,
      to
    );

    /* ===========================
       Execute Query
    =========================== */

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }

    /* ===========================
       Summary
    =========================== */

    const summary =
      await getSummary();

    /* ===========================
       Response
    =========================== */

    return NextResponse.json({
      success: true,

      data: data || [],

      summary,

      pagination: {
        page,

        pageSize,

        total: count || 0,

        totalPages: Math.ceil(
          (count || 0) /
            pageSize
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET Payment Methods Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load payment methods.",
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
   POST
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const payload = {
      payment_method_code:
        body?.payment_method_code
          ?.trim()
          ?.toUpperCase(),

      payment_method_name:
        body?.payment_method_name
          ?.trim(),

      payment_method_name_en:
        body?.payment_method_name_en
          ?.trim() || null,

      description:
        body?.description?.trim() ||
        null,

      payment_type:
        body?.payment_type ||
        "bank_transfer",

      bank_required:
        body?.bank_required ??
        false,

      supports_payroll:
        body?.supports_payroll ??
        true,

      supports_expense:
        body?.supports_expense ??
        false,

      supports_benefit:
        body?.supports_benefit ??
        false,

      supports_vendor:
        body?.supports_vendor ??
        false,

      require_account_name:
        body?.require_account_name ??
        true,

      require_account_number:
        body?.require_account_number ??
        true,

      require_promptpay_id:
        body?.require_promptpay_id ??
        false,

      allow_multiple_accounts:
        body?.allow_multiple_accounts ??
        false,

      qr_supported:
        body?.qr_supported ??
        false,

      api_supported:
        body?.api_supported ??
        false,

      sort_order:
        Number(
          body?.sort_order
        ) || 0,

      status:
        body?.status ||
        "active",
    };

    /* ===========================
       Validation
    =========================== */

    if (
      !payload.payment_method_code
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสวิธีการจ่ายเงิน",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !payload.payment_method_name
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อวิธีการจ่ายเงิน",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate :
       Payment Method Code
    =========================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("payment_methods")
      .select("id")
      .eq(
        "payment_method_code",
        payload.payment_method_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสวิธีการจ่ายเงินนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate :
       Payment Method Name
    =========================== */

    const {
      data: duplicateName,
    } = await supabaseAdmin
      .from("payment_methods")
      .select("id")
      .eq(
        "payment_method_name",
        payload.payment_method_name
      )
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อวิธีการจ่ายเงินนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Insert
    =========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payment_methods")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    /* ===========================
       Activity Log
    =========================== */

    await writeActivityLog({
      module_name:
        "Payment Methods",

      action_type:
        "CREATE",

      reference_table:
        "payment_methods",

      reference_id:
        data.id,

      description: `สร้างวิธีการจ่ายเงิน ${data.payment_method_name}`,

      old_data: null,

      new_data: data,
    });

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มวิธีการจ่ายเงินเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "POST Payment Methods Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to create payment method.",
      },
      {
        status: 500,
      }
    );
  }
}