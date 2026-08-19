// app/jobs/api/marital_statuses/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
    try {

        const { data, error } = await supabaseAdmin
            .from("marital_statuses")
            .select("id, marital_status_name_th, marital_status_name_en")
            .eq("status","active")
            .order("sort_order", { ascending: true });
        
          if (error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
          }
        
          return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message, },
            { status: 500, }
        );
    }
}