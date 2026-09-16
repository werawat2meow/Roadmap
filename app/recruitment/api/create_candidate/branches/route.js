import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select(`
        id,
        branch_name
      `)
      .order("branch_name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "GET /recruitment/api/branches error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
          data: [],
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /recruitment/api/branches exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Unable to load branches.",
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}