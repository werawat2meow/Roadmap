import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/app/recruitment/lib/getUserId";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  getProvinceByCode,
  getDistrictByCode,
  getSubdistrictByCode,
} from "geothai";

export async function GET(request, { params }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");  

  const userId = await getUserIdFromRequest();

  console.log(token , userId);

  // ไม่ login → ต้องมี token ที่ valid เท่านั้นถึงจะเข้าได้
  if (!userId) {
    console.log("if");
    
    if (!token) {
      console.log("if token");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: share, error: shareError } = await supabaseAdmin
      .from("recruit_candidate_share_tokens")
      .select("application_id, expires_at, revoked_at")
      .eq("token", token)
      .eq("application_id", id)
      .single();

    if (shareError) {
      console.error("share token lookup error:", shareError);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      !share ||
      share.revoked_at ||
      new Date(share.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const { data: application, error: appError } = await supabaseAdmin
    .from("recruit_job_applications")
    .select(`
      *,
      positions (
        id,
        position_name
      ),
      titles (
        id,
        title_name_th
      ),
      genders (
        gender_name_th
      ),
      nationalities (
        nationality_name_th
      ),
      religions (
        religion_name_th
      ),
      marital_statuses (
        marital_status_name_th
      )
    `)
    .eq("id", id)
    .single();

  if (appError || !application) {
    console.error("application lookup error:", appError);
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 }
    );
  }

  const [
    educationResult,
    workResult,
    skillsResult,
    documentResult,
    interviewResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("recruit_job_education_history")
      .select("*")
      .eq("application_id", id)
      .order("id"),

    supabaseAdmin
      .from("recruit_job_work_experience")
      .select("*")
      .eq("application_id", id)
      .order("id"),

    supabaseAdmin
      .from("recruit_job_skills")
      .select("*")
      .eq("application_id", id)
      .order("id"),

    supabaseAdmin
      .from("recruit_job_documents")
      .select("*")
      .eq("application_id", id)
      .order("id"),

    supabaseAdmin
      .from("recruit_job_interviews")
      .select("*")
      .eq("application_id", id)
      .order("interview_round", { ascending: false })
      .limit(1),
  ]);

  application.province_name = getProvinceByCode(application.province_id)?.name_th;
  application.district_name = getDistrictByCode(application.district_id)?.name_th;
  application.subdistrict_name = getSubdistrictByCode(application.subdistrict_id)?.name_th;
  const skills = skillsResult.data || [];  

  return NextResponse.json({
    success: true,
    data: {
      application,
      education: educationResult.data ?? [],
      workExperience: workResult.data ?? [],
      languageSkills: skills.filter( (item) => item.skill_type === "language" ),
      systemProgramSkills: skills.filter( (item) => item.skill_type === "system_program" ),
      documents: documentResult.data ?? [],
      interviews: interviewResult.data ?? [],
    },
  });
}