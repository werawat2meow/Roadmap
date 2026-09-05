import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  getProvinceByCode,
  getDistrictByCode,
  getSubdistrictByCode,
} from "geothai";

export async function GET(request, { params }) {

  try {
    const { id } = await params;

    // ============================
    // Application
    // ============================

    const { data: application, error } = await supabaseAdmin
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
        genders(
          id,
          gender_name_th
        ),
        nationalities(
          id,
          nationality_name_th
        ),
        religions(
          id,
          religion_name_th
        ),
        marital_statuses(
          id,
          marital_status_name_th
        )
      `)
      .eq("id", id)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    // ============================
    // Query พร้อมกัน
    // ============================

    const [
      educationResult,
      workResult,
      skillsResult,
      documentResult,
      interviewResult,
      additionalCosts,
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

      supabaseAdmin
        .from("recruit_additional_cost")
        .select("id, cost_type, topic, amount")
        .eq("application_id", id)
        .order("id", { ascending: true }),
    ]);

    application.province_name =
      getProvinceByCode(application.province_id)?.name_th;

    application.district_name =
      getDistrictByCode(application.district_id)?.name_th;

    application.subdistrict_name =
      getSubdistrictByCode(application.subdistrict_id)?.name_th;

    const skills = skillsResult.data || [];

    const additional_cost = (additionalCosts.data ?? [])
      .filter((item) => item.cost_type === "additional")
      .map((item) => ({
        id: item.id,
        name: item.topic,
        amount: Number(item.amount || 0),
      }));

    const additional_compensation = (additionalCosts.data ?? [])
      .filter((item) => item.cost_type === "compensation")
      .map((item) => ({
        id: item.id,
        name: item.topic,
        amount: Number(item.amount || 0),
      }));

    return NextResponse.json({
      application: {
        ...application,
        additional_cost,
        additional_compensation,
      },
      education: educationResult.data || [],
      workExperience: workResult.data || [],
      skills,
      languageSkills: skills.filter(
        (item) => item.skill_type === "language"
      ),
      systemProgramSkills: skills.filter(
        (item) => item.skill_type === "system_program"
      ),
      documents: documentResult.data || [],
      interviews: interviewResult.data || [],
    });
  } catch (err) {
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