import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
    try {

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