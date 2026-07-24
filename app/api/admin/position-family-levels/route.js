import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const familyId =
      searchParams.get("family_id");

    if (!familyId) {
      return NextResponse.json(
        {
          success: false,
          error: "family_id is required",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("position_family_levels")
        .select(`
          id,
          position_family_id,
          position_level_id,
          position_levels(
            id,
            level_code,
            level_name,
            sort_order
          )
        `)
        .eq(
          "position_family_id",
          familyId
        )
        .order(
          "sort_order",
          {
            foreignTable:
              "position_levels",
            ascending: true,
          }
        );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();

    const familyId = body.family_id;
    const levelIds = Array.isArray(body.level_ids)
      ? [...new Set(body.level_ids)]
      : [];

    if (!familyId) {
      return NextResponse.json(
        {
          success: false,
          error: "family_id is required",
        },
        { status: 400 }
      );
    }

    /* ===========================
        Load Existing Mapping
    =========================== */

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("position_family_levels")
      .select(`
        id,
        position_level_id
      `)
      .eq("position_family_id", familyId);

    if (existingError) throw existingError;

    /* ===========================
        Compare Data
    =========================== */

    const existingLevelIds = new Set(
      existing.map((item) => item.position_level_id)
    );

    const incomingLevelIds = new Set(levelIds);

    /* ===========================
        Delete Mapping
    =========================== */

    const deleteIds = existing
      .filter(
        (item) =>
          !incomingLevelIds.has(
            item.position_level_id
          )
      )
      .map((item) => item.id);

    if (deleteIds.length > 0) {
      const { error } =
        await supabaseAdmin
          .from("position_family_levels")
          .delete()
          .in("id", deleteIds);

      if (error) throw error;
    }

    /* ===========================
        Insert Mapping
    =========================== */

    const insertRows = levelIds
      .filter(
        (id) =>
          !existingLevelIds.has(id)
      )
      .map((id) => ({
        position_family_id: familyId,
        position_level_id: id,
      }));

    if (insertRows.length > 0) {
      const { error } =
        await supabaseAdmin
          .from("position_family_levels")
          .insert(insertRows);

      if (error) throw error;
    }

    /* ===========================
        Success
    =========================== */

    return NextResponse.json({
      success: true,
      message:
        "Position Family Levels updated successfully.",
      data: {
        added: insertRows.length,
        removed: deleteIds.length,
        total: levelIds.length,
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}