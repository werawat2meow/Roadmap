import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserIdFromRequest() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    const userId = decoded?.user_id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    return userId;
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();

    const userId = await  getUserIdFromRequest();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const branchId = payload.branch_id;
    const departmentId = payload.department_id;
    const divisionId = payload.division_id;
    const unitId = payload.unit_id;
    const positionId = payload.position_id;
    const openingCount = payload.opening_count;

    if (
      !branchId ||
      !departmentId ||
      !divisionId ||
      !unitId ||
      !positionId ||
      !openingCount ||
      !payload.start_date ||
      !payload.end_date
    ) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const insertData = {
      branch_id: branchId,
      department_id: departmentId,
      division_id: divisionId,
      unit_id: unitId,
      position_id: positionId,
      opening_count: openingCount,
      start_date: payload.start_date,
      end_date: payload.end_date,
      urgent: Boolean(payload.urgent),
      updated_at: new Date().toISOString(),
      user_create: userId,
      user_update: userId,
      status: true,
    };

    const { data, error } = await supabaseAdmin
      .from("recruit_job_open")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลเรียบร้อย",
    //   data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const pageSize = Math.max(
      Number(searchParams.get("pageSize") || 10),
      1
    );

    const search = searchParams.get("search")?.trim();

    const branchId = searchParams.get("branch_id");
    const departmentId = searchParams.get("department_id");
    const divisionId = searchParams.get("division_id");
    const unitId = searchParams.get("unit_id");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let countQuery = supabaseAdmin
      .from("v_recruit_job_open_list")
      .select("*", {
        head: true,
        count: "exact",
      });

    let dataQuery = supabaseAdmin
      .from("v_recruit_job_open_list")
      .select("*")
      .order("id", { ascending: false })
      .range(from, to);

    // Search Position
    if (search) {
      const keyword = `%${search}%`;

      const searchCondition = [
        `position_name.ilike.${keyword}`,
        `position_level.ilike.${keyword}`,
      ].join(",");

      countQuery = countQuery.or(searchCondition);
      dataQuery = dataQuery.or(searchCondition);
    }

    // Company
    if (branchId) {
      countQuery = countQuery.eq("branch_id", branchId);
      dataQuery = dataQuery.eq("branch_id", branchId);
    }

    // Department
    if (departmentId) {
      countQuery = countQuery.eq(
        "department_id",
        departmentId
      );

      dataQuery = dataQuery.eq(
        "department_id",
        departmentId
      );
    }

    // Division
    if (divisionId) {
      countQuery = countQuery.eq(
        "division_id",
        divisionId
      );

      dataQuery = dataQuery.eq(
        "division_id",
        divisionId
      );
    }

    // Unit
    if (unitId) {
      countQuery = countQuery.eq(
        "unit_id",
        unitId
      );

      dataQuery = dataQuery.eq(
        "unit_id",
        unitId
      );
    }

    const [countRes, dataRes] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countRes.error) {
      return NextResponse.json(
        {
          success: false,
          message: countRes.error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (dataRes.error) {
      return NextResponse.json(
        {
          success: false,
          message: dataRes.error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total: countRes.count ?? 0,
      rows: dataRes.data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}