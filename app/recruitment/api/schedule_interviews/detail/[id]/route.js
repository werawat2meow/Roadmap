import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 1) ข้อมูลผู้สมัคร
    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("id,first_name, last_name, positions(position_name)")
      .eq("id", id)
      .single();

    if (applicantError || !applicant) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลผู้สมัคร" },
        { status: 404 }
      );
    }

    // 2) เอกสารแนบ
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from("recruit_job_documents")
      .select("document_type, file_name, file_url")
      .eq("application_id", id)
      .order("file_name", { ascending: true });

    if (documentsError) {
      return NextResponse.json(
        { message: "ไม่สามารถดึงข้อมูลเอกสารแนบได้" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applicant,
      documents: documents ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}