import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserAccess } from "@/app/recruitment/lib/getUserId";

export async function GET(request) {
  try {
    
    const { searchParams } = new URL(request.url);

    // ---------- Lookup mode: ตัวเลือกตำแหน่งงาน ----------
    if (searchParams.get("resource") === "positions") {
      const { data, error } = await supabaseAdmin
        .from("positions")
        .select("id, position_name")
        .order("position_name", { ascending: true });

      if (error) {
        console.error("Get positions error:", error);

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: data ?? [],
      });
    }

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

    const all_scrop = Boolean(user.all_scrop);

    let status = all_scrop
      ? [1, 2, 3, 6, 7, 8, 9, 16, 99]
      : [1, 2, 3, 6, 7, 8, 9];

    // ---------- List mode: รายการผู้สมัคร ----------
    const ch_status = searchParams.get("status");

    if (ch_status) {
      const parsedStatus = Number(ch_status);

      if (Number.isFinite(parsedStatus)) {
        // เคลียร์ status เดิม แล้วใช้ status ที่ส่งเข้ามา
        status = [parsedStatus];
      }
    }

    // ---------- List mode: รายการผู้สมัคร ----------
    
    const positionId = searchParams.get("position_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const pageParam = parseInt(
      searchParams.get("page") || "1",
      10
    );

    const page = Number.isFinite(pageParam)
      ? Math.max(pageParam, 1)
      : 1;

    const pageSizeParam =
      searchParams.get("pageSize") || "10";

    const isAll = pageSizeParam === "all";

    let pageSize = 10;

    if (!isAll) {
      const parsedPageSize = parseInt(pageSizeParam, 10);

      if (
        !Number.isFinite(parsedPageSize) ||
        parsedPageSize <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid pageSize" },
          { status: 400 }
        );
      }

      pageSize = parsedPageSize;
    }

    const { data, error } = await supabaseAdmin.rpc(
      "search_recruit_job_applications",
      {
        p_status: status,
        p_position_id: positionId || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
        p_branch_ids: branchIds,
        p_page: page,
        p_page_size: isAll ? 999999 : pageSize,
      }
    );

    if (error) {
      console.error(
        "search_recruit_job_applications error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const total = data?.length
      ? Number(data[0].total_count ?? 0)
      : 0;

    return NextResponse.json({
      data: data ?? [],
      count: total,
    });
  } catch (err) {
    console.error("GET recruitment error:", err);

    return NextResponse.json(
      {
        error:
          err?.message ??
          "Unexpected server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message, },
      { status: 500, }
    );
  }
}
