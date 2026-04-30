import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("unit_positions")
      .select(
        `
          id,
          unit_id,
          position_id,
          headcount_target,
          status,
          created_at,
          units (
            unit_name,
            divisions (
              division_name,
              departments (
                department_name
              )
            )
          ),
          positions (
            position_name,
            position_level
          )
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search) {
      const keyword = `%${search}%`;

      const { data: positionRows, error: positionError } = await supabaseAdmin
        .from("positions")
        .select("id")
        .or(
          [
            `position_name.ilike.${keyword}`,
            `position_level.ilike.${keyword}`,
          ].join(",")
        );

      if (positionError) throw positionError;

      const { data: departmentRows, error: departmentError } =
        await supabaseAdmin
          .from("departments")
          .select("id")
          .ilike("department_name", keyword);

      if (departmentError) throw departmentError;

      const departmentIds = (departmentRows || []).map((item) => item.id);

      const { data: divisionRows, error: divisionError } = await supabaseAdmin
        .from("divisions")
        .select("id")
        .or(`division_name.ilike.${keyword}`);

      if (divisionError) throw divisionError;

      let divisionIds = (divisionRows || []).map((item) => item.id);

      if (departmentIds.length > 0) {
        const { data: divisionsByDepartment, error: divisionsByDepartmentError } =
          await supabaseAdmin
            .from("divisions")
            .select("id")
            .in("department_id", departmentIds);

        if (divisionsByDepartmentError) throw divisionsByDepartmentError;

        divisionIds = [
          ...divisionIds,
          ...(divisionsByDepartment || []).map((item) => item.id),
        ];
      }

      divisionIds = [...new Set(divisionIds)];

      const { data: unitRows, error: unitError } = await supabaseAdmin
        .from("units")
        .select("id")
        .or(`unit_name.ilike.${keyword}`);

      if (unitError) throw unitError;

      let unitIds = (unitRows || []).map((item) => item.id);

      if (divisionIds.length > 0) {
        const { data: unitsByDivision, error: unitsByDivisionError } =
          await supabaseAdmin
            .from("units")
            .select("id")
            .in("division_id", divisionIds);

        if (unitsByDivisionError) throw unitsByDivisionError;

        unitIds = [
          ...unitIds,
          ...(unitsByDivision || []).map((item) => item.id),
        ];
      }

      unitIds = [...new Set(unitIds)];

      const positionIds = (positionRows || []).map((item) => item.id);

      const orConditions = [];

      if (unitIds.length > 0) {
        orConditions.push(`unit_id.in.(${unitIds.join(",")})`);
      }

      if (positionIds.length > 0) {
        orConditions.push(`position_id.in.(${positionIds.join(",")})`);
      }

      if (orConditions.length === 0) {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        query = query.or(orConditions.join(","));
      }
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const mappedData = (data || []).map((item) => ({
      id: item.id,
      unit_id: item.unit_id,
      position_id: item.position_id,
      unit_name: item.units?.unit_name || "-",
      division_name: item.units?.divisions?.division_name || "-",
      department_name: item.units?.divisions?.departments?.department_name || "-",
      position_name: item.positions?.position_name || "-",
      position_level: item.positions?.position_level || "",
      headcount_target: item.headcount_target ?? 0,
      status: item.status,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET_UNIT_POSITIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถดึงข้อมูลกำหนดตำแหน่งตามหน่วยได้",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const unit_id = body?.unit_id || null;
    const position_id = body?.position_id || null;
    const headcount_target = Number(body?.headcount_target ?? 0);
    const status = body?.status || "active";

    if (!unit_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกหน่วยงาน" },
        { status: 400 }
      );
    }

    if (!position_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกตำแหน่ง" },
        { status: 400 }
      );
    }

    if (headcount_target < 0) {
      return NextResponse.json(
        { error: "จำนวนอัตราต้องไม่น้อยกว่า 0" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("unit_positions")
      .select("id")
      .eq("unit_id", unit_id)
      .eq("position_id", position_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "หน่วยงานนี้มีตำแหน่งนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("unit_positions")
      .insert([
        {
          unit_id,
          position_id,
          headcount_target,
          status,
        },
      ])
      .select(`
        id,
        unit_id,
        position_id,
        headcount_target,
        status,
        created_at,
        units (
          unit_name,
          divisions (
            division_name,
            departments (
              department_name
            )
          )
        ),
        positions (
          position_name,
          position_level
        )
      `)
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลสำเร็จ",
      data: {
        id: inserted.id,
        unit_id: inserted.unit_id,
        position_id: inserted.position_id,
        unit_name: inserted.units?.unit_name || "-",
        division_name: inserted.units?.divisions?.division_name || "-",
        department_name:
          inserted.units?.divisions?.departments?.department_name || "-",
        position_name: inserted.positions?.position_name || "-",
        position_level: inserted.positions?.position_level || "",
        headcount_target: inserted.headcount_target ?? 0,
        status: inserted.status,
        created_at: inserted.created_at,
      },
    });
  } catch (error) {
    console.error("CREATE_UNIT_POSITION_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลได้" },
      { status: 500 }
    );
  }
}