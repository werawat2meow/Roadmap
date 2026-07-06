import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {

  const started = Date.now();

  try {

    const { error } = await supabaseAdmin
      .from("employees")
      .select("id")
      .limit(1);

    if (error) throw error;

    return NextResponse.json({

      success: true,

      status: "healthy",

      timestamp: new Date().toISOString(),

      uptime_ms: process.uptime() * 1000,

      response_time_ms: Date.now() - started,

      services: {

        api: "OK",

        database: "OK"

      }

    });

  } catch (error) {

    return NextResponse.json({

      success: false,

      status: "unhealthy",

      timestamp: new Date().toISOString(),

      response_time_ms: Date.now() - started,

      services: {

        api: "OK",

        database: "ERROR"

      },

      error: error.message

    }, { status: 500 });

  }

}