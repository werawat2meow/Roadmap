import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserAccess } from "@/app/recruitment/lib/getUserId";

/**
 * GET /recruitment/api/schedule_interviews
 *
 * Query params (list mode - default):
 *   status       : ค่า status (number) - optional
 *   position_id  : id ของตำแหน่งงาน - optional
 *   reviewer_id  : id ของผู้สัมภาษณ์ (employees.id) - optional
 *   date_from    : วันที่เริ่มต้น interview_datetime - optional
 *   date_to      : วันที่สิ้นสุด interview_datetime - optional
 *   page         : เลขหน้า (default 1)
 *   pageSize     : 10|20|30|40|50|100|all (default 10)
 *
 * Query params (lookup mode):
 *   resource=positions
 *      -> คืนรายการตำแหน่งงานทั้งหมด { id, position_name }
 *
 *   resource=reviewers
 *      -> คืนรายการผู้สัมภาษณ์จาก employees
 *         { id, first_name_th, last_name_th }
 */
export async function GET(request) {
  try {
    // ============================================================
    // ตรวจสอบ User Access
    // ============================================================
    const user = await getUserAccess();

    if (!user) {
      return NextResponse.json(
        { error: "Not set company Data" },
        { status: 401 }
      );
    }

    const branchArray = user.branchArray ?? [];

    const branchIds = branchArray
      .map((branch) => branch.id)
      .filter(Boolean);

    // ============================================================
    // ไม่มี branchArray
    // ============================================================
    if (branchIds.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลสาขา" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    // ============================================================
    // Lookup mode
    // ============================================================
    const resource = searchParams.get("resource");

    // ============================================================
    // Lookup: Positions
    // ============================================================
    if (resource === "positions") {
      const { data, error } = await supabaseAdmin
        .from("positions")
        .select("id, position_name")
        .order("position_name", {
          ascending: true,
        });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: data ?? [],
      });
    }

    // ============================================================
    // Lookup: Reviewers / Interviewers
    //
    // employees
    //   id
    //   first_name_th
    //   last_name_th
    // ============================================================
    if (resource === "reviewers") {
      const { data, error } = await supabaseAdmin
        .from("recruit_job_interviews")
        .select(`
          reviewer,
          employees!inner (
            id,
            first_name_th,
            last_name_th
          )
        `)
        .not("reviewer", "is", null)
        .eq("status" , 5)
        .order("employees(first_name_th)", {
          ascending: true,
        })
        .order("employees(last_name_th)", {
          ascending: true,
        });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // เอาเฉพาะ reviewer ที่ไม่ซ้ำกัน
      const reviewers = Array.from(
        new Map(
          (data ?? []).map((item) => [
            item.reviewer,
            {
              id: item.employees.id,
              first_name_th: item.employees.first_name_th,
              last_name_th: item.employees.last_name_th,
            },
          ])
        ).values()
      );

      return NextResponse.json({
        data: reviewers,
      });
    }

    // ============================================================
    // List mode
    // ============================================================
    const status = searchParams.get("status");
    const positionId = searchParams.get("position_id");
    const reviewerId = searchParams.get("reviewer_id");

    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // ============================================================
    // Pagination
    // ============================================================
    const page = Math.max(
      parseInt(searchParams.get("page") || "1", 10),
      1
    );

    const pageSizeParam =
      searchParams.get("pageSize") || "10";

    const isAll = pageSizeParam === "all";

    let pageSize = isAll
      ? null
      : parseInt(pageSizeParam, 10);

    if (
      !isAll &&
      (!Number.isFinite(pageSize) || pageSize <= 0)
    ) {
      pageSize = 10;
    }

    if (!isAll) {
      pageSize = Math.min(pageSize, 100);
    }

    // ============================================================
    // หา position_id ที่ User มีสิทธิ์
    //
    // positions
    //   -> unit_positions
    //   -> units
    //   -> divisions
    //   -> departments
    //   -> branch_departments
    //   -> branch_id
    // ============================================================
    
    const {
      data: branchPositions,
      error: branchPositionsError,
    } = await supabaseAdmin
      .from("positions")
      .select(
        `
          id,
          unit_positions!inner (
            units!inner (
              divisions!inner (
                departments!inner (
                  branch_departments!inner (
                    branch_id
                  )
                )
              )
            )
          )
        `
      )
      .in(
        "unit_positions.units.divisions.departments.branch_departments.branch_id",
        branchIds
      );

    if (branchPositionsError) {
      return NextResponse.json(
        {
          error: branchPositionsError.message,
        },
        { status: 500 }
      );
    }

    const allowedPositionIds = [
      ...new Set(
        (branchPositions ?? []).map((p) => p.id)
      ),
    ];    

    // ============================================================
    // ถ้าไม่มีตำแหน่งที่ User มีสิทธิ์
    // ============================================================
    if (allowedPositionIds.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0,
      });
    }

    // ============================================================
    // Main Query
    // ============================================================
    let query = supabaseAdmin
      .from("recruit_job_applications")
      .select(
        `
          id,
          first_name,
          last_name,
          created_at,
          status,
          position_id,

          titles (
            title_name_th
          ),

          positions (
            position_name
          ),

          recruit_job_interviews!inner (
            id,
            interview_datetime,
            interview_order,
            reviewer
          )
        `,
        {
          count: "exact",
        }
      )

      // เรียง Interview ล่าสุดก่อน
      .order("interview_order", {
        foreignTable: "recruit_job_interviews",
        ascending: false,
      })

      // Application ล่าสุดก่อน
      .order("created_at", {
        ascending: false,
      });

    // ============================================================
    // จำกัด Position เฉพาะ User ที่ไม่มีสิทธิ์ all_scrop
    // ============================================================
    if (user.all_scrop !== true) {
      query = query.in("position_id", allowedPositionIds);
    }

    // ============================================================
    // Filter: Status
    // ============================================================
    if (
      status !== null &&
      status !== "" &&
      status !== undefined
    ) {
      const statusNum = Number(status);

      if (!Number.isNaN(statusNum)) {
        query = query.eq("status", statusNum);
      }
    } else {
      // Default status
      query = query.in("status", [4,5,6,8,9,10,11,]);
    }

    // ============================================================
    // Filter: Position
    // ============================================================
    if (positionId) {
      query = query.eq(
        "position_id",
        positionId
      );
    }

    // ============================================================
    // Filter: Reviewer / Interviewer
    //
    // recruit_job_interviews.reviewer
    //       =
    // employees.id
    // ============================================================
    if (reviewerId) {
      query = query.eq(
        "recruit_job_interviews.reviewer",
        reviewerId
      );
    }

    // ============================================================
    // Filter: Interview Date From
    // ============================================================
    if (dateFrom) {
      query = query.gte(
        "recruit_job_interviews.interview_datetime",
        `${dateFrom} 00:00:00`
      );
    }

    // ============================================================
    // Filter: Interview Date To
    // ============================================================
    if (dateTo) {
      query = query.lte(
        "recruit_job_interviews.interview_datetime",
        `${dateTo} 23:59:59`
      );
    }

    // ============================================================
    // Pagination
    // ============================================================
    if (!isAll) {
      const from =
        (page - 1) * pageSize;

      const to =
        from + pageSize - 1;

      query = query.range(from, to);
    }

    // ============================================================
    // Execute Query
    // ============================================================
    const {
      data,
      error,
      count,
    } = await query;    

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // Response
    // ============================================================
    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err?.message ??
          "Unexpected server error",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PUT /recruitment/api/schedule_interviews
 */
export async function PUT(request) {
  try {
    const { id, status } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        {
          error: "Missing id",
        },
        {
          status: 400,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err?.message,
      },
      {
        status: 500,
      }
    );
  }
}