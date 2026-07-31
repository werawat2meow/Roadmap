import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

function mapRow(item) {
  return {
    id: item.id,

    component_code: item.component_code,
    component_name: item.component_name,

    description:
      item.description || "",

    component_type:
      item.component_type,

    calculation_type:
      item.calculation_type,

    taxable:
      item.taxable,

    social_security:
      item.social_security,

    provident_fund:
      item.provident_fund,

    accounting_code:
      item.accounting_code || "",

    sort_order:
      item.sort_order,

    status:
      item.status,

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const all =
      searchParams.get("all") === "true";

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const search =
      searchParams.get("search") || "";

    const status =
      searchParams.get("status") || "";

    let query = supabaseAdmin
      .from("salary_components")
      .select("*", {
        count: "exact",
      });

    /* ==========================
       Search
    ========================== */

    if (search) {
      query = query.or(
        [
          `component_code.ilike.%${search}%`,
          `component_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* ==========================
       Status
    ========================== */

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
      "component_code",
      {
        ascending: true,
      }
    );

    /* ==========================
       All
    ========================== */

    if (all) {
      const {
        data,
        error,
      } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data:
          data.map(mapRow),
      });
    }

    /* ==========================
       Pagination
    ========================== */

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(
      from,
      to
    );

    if (error) throw error;

    /* ==========================
       Summary
    ========================== */

    const {
      count: total,
    } = await supabaseAdmin
      .from(
        "salary_components"
      )
      .select("*", {
        count: "exact",
        head: true,
      });

    const {
      count: active,
    } = await supabaseAdmin
      .from(
        "salary_components"
      )
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "status",
        "active"
      );

    const {
      count: inactive,
    } = await supabaseAdmin
      .from(
        "salary_components"
      )
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "status",
        "inactive"
      );

    return NextResponse.json({
      success: true,

      data:
        data.map(mapRow),

      summary: {
        total,
        active,
        inactive,
      },

      pagination: {
        page,
        pageSize,

        total: count,

        totalPages:
          Math.ceil(
            count / pageSize
          ),
      },
    });
  } catch (error) {
    console.error(error);

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
   POST
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    /* ==========================
       Validation
    ========================== */

    if (!body.component_code?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุรหัสรายการเงินเดือน",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.component_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุชื่อรายการเงินเดือน",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.component_type) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกประเภทรายการ",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.calculation_type) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกประเภทการคำนวณ",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
       Duplicate Code
    ========================== */

    const { data: duplicateCode } =
      await supabaseAdmin
        .from("salary_components")
        .select("id")
        .eq(
          "component_code",
          body.component_code
            .trim()
            .toUpperCase()
        )
        .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสรายการเงินเดือนนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
       Duplicate Name
    ========================== */

    const { data: duplicateName } =
      await supabaseAdmin
        .from("salary_components")
        .select("id")
        .eq(
          "component_name",
          body.component_name.trim()
        )
        .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อรายการเงินเดือนนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
       Payload
    ========================== */

    const payload = {
      component_code:
        body.component_code
          .trim()
          .toUpperCase(),

      component_name:
        body.component_name.trim(),

      description:
        body.description?.trim() ||
        null,

      component_type:
        body.component_type,

      calculation_type:
        body.calculation_type,

      taxable:
        body.taxable ?? true,

      social_security:
        body.social_security ??
        false,

      provident_fund:
        body.provident_fund ??
        false,

      accounting_code:
        body.accounting_code?.trim() ||
        null,

      sort_order:
        Number(
          body.sort_order
        ) || 0,

      status:
        body.status || "active",
    };

    /* ==========================
       Insert
    ========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("salary_components")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    /* ==========================
       Activity Log
    ========================== */

    await writeActivityLog({
      module_name:
        "Salary Components",

      action_type: "CREATE",

      reference_table:
        "salary_components",

      reference_id: data.id,

      description: `สร้างรายการเงินเดือน ${data.component_name}`,

      new_data: data,
    });

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มรายการเงินเดือนสำเร็จ",

      data: mapRow(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
