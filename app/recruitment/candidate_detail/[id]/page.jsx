import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import CandidateDetail from "@/app/recruitment/components/CandidateDetail";
import {
    getProvinceByCode,
    getDistrictByCode,
    getSubdistrictByCode,
} from "geothai";

export default async function Page({ params }) {
  const { id } = await params;

  // ============================
  // Application
  // ============================
  const { data: application, error: applicationError } =
    await supabaseAdmin
      .from("recruit_job_applications")
      .select(`
        *,
        positions (
          id,
          position_name
        )
      `)
      .eq("id", id)
      .single();

  if (applicationError || !application) {
    notFound();
  }

  // ============================
  // Education
  // ============================
  const { data: education = [] } = await supabaseAdmin
    .from("recruit_job_education_history")
    .select("*")
    .eq("application_id", id)
    .order("id");

  // ============================
  // Work Experience
  // ============================
  const { data: workExperience = [] } = await supabaseAdmin
    .from("recruit_job_work_experience")
    .select("*")
    .eq("application_id", id)
    .order("id");

  // ============================
  // Skills
  // ============================
  const { data: skills = [] } = await supabaseAdmin
    .from("recruit_job_skills")
    .select("*")
    .eq("application_id", id)
    .order("id");

  // ============================
  // Documents
  // ============================
  const { data: documents = [] } = await supabaseAdmin
    .from("recruit_job_documents")
    .select("*")
    .eq("application_id", id)
    .order("id");

  application.province_name = getProvinceByCode(application.province_id)?.name_th;  
  application.district_name = getDistrictByCode(application.district_id)?.name_th;
  application.subdistrict_name = getSubdistrictByCode(application.subdistrict_id)?.name_th;

  const languageSkills = skills.filter( (item) => item.skill_type === "language");
  const systemProgramSkills = skills.filter( (item) => item.skill_type === "system_program");

  // ============================
  // Layout
  // ============================
  return (
    <CandidateDetail
      application={application}
      education={education}
      workExperience={workExperience}
      languageSkills={languageSkills}
      systemProgramSkills={systemProgramSkills}
      documents={documents}
    />
  );
}