// app/jobs/api/register/resume/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(_req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) { return NextResponse.json({ error: "Id is required" }, { status: 400 }); }

  try {
    const { data, error } = await supabaseAdmin
      .from("recruit_job_applications")
      .select(`
        first_name,
        last_name,
        line_id,
        email,
        phone_number,
        other_position,
        expected_salary,
        self_presentation_url,
        status,
        positions( id, position_name)
      `)
      .eq("id",id)
      .single();

    const { data: doc_data, error: doc_error  } = await supabaseAdmin
      .from("recruit_job_documents")
      .select(`*`)
      .eq("application_id",id);

    const applications_data = {
      personal:{
        firstName: data.first_name,
        lastName: data.last_name,
        lineId: data.line_id,
        email: data.email,
        phoneNumber: data.phone_number,
        otherPosition: data.other_position,
        expectedSalary: data.expected_salary,
      }
    }
    
    return NextResponse.json(
      { success: true, data , applications_data , documents:doc_data },
      { status: 201 }
    );
    
  } catch (err: any) {
    return NextResponse.json(
      {
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}