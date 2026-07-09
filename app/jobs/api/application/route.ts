import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  uploadFileToSpaces,
  deleteFileFromSpaces,
} from "@/app/jobs/lib/spaces";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // ประกาศไว้นอก try เพื่อให้ catch ชั้นนอกสุดเข้าถึงได้ ถ้าจำเป็น
  let applicationId: string | null = null;
  const uploadedKeys: string[] = [];

  try {
    /* ------------------------------------------------------------ */
    /*                      Parse Payload                            */
    /* ------------------------------------------------------------ */

    const contentType = request.headers.get("content-type") ?? "";

    let payload: any;
    let formData: FormData | null = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      
      const payloadRaw = formData.get("payload");
      payload = typeof payloadRaw === "string" ? JSON.parse(payloadRaw) : null;
    } else {
      payload = await request.json();
      payload = payload?.payload ?? payload;
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Missing application payload." },
        { status: 400 }
      );
    }

    const personal = payload.personal ?? {};
    const agreement = payload.agreement ?? {};
    const positionId = payload.positionId ?? payload.position_id ?? null;

    /* ------------------------------------------------------------ */
    /*         1) Insert recruit_job_applications ก่อนอันดับแรก         */
    /* ------------------------------------------------------------ */

    const applicationData = {
      job_id: payload.jobId,
      position_id: positionId,
      other_position: personal.otherPosition ?? "",
      expected_salary: Number(personal.expectedSalary ?? payload.expected_salary ?? 0),
      first_name: personal.firstName ?? "",
      last_name: personal.lastName ?? "",
      nickname_th: personal.nicknameTH ?? "",
      nickname_en: personal.nicknameEN ?? "",
      date_of_birth: personal.dateOfBirth ?? "",
      age: Number(personal.age ?? 0),
      gender: personal.gender ?? null,
      military_status: personal.militaryStatus ?? "",
      pregnancy_age: personal.pregnancyAge ?? null,
      height: Number(personal.height ?? 0),
      weight: Number(personal.weight ?? 0),
      nationality: personal.nationality ?? "",
      religion: personal.religion ?? "",
      identity_no: personal.idCardNo ?? "",
      current_address_no: Number(personal.addressNo ?? 0),
      village_no: Number(personal.villageNo ?? 0),
      street: personal.street ?? "",
      sub_district: personal.subDistrict ?? "",
      district: personal.district ?? "",
      province: personal.province ?? "",
      postal_code: Number(personal.postalCode ?? 0),
      line_id: personal.lineId ?? "",
      phone_number: personal.phoneNumber ?? "",
      residence_type: personal.residenceType ?? [],
      residence_other: personal.residenceOther ?? "",
      marital_status: personal.maritalStatus ?? [],
      children: personal.children ?? null,
      driver_license: personal.driverLicense ?? null,
      emergency_name: personal.emergencyContact?.name ?? "",
      emergency_phone: personal.emergencyContact?.phone ?? "",
      emergency_relationship: personal.emergencyContact?.relationship ?? "",
      underlying_disease: personal.underlyingDisease ?? "",
      serious_crime: personal.criminalRecord ?? null,
      dishonest: personal.dishonestyRecord ?? null,
      certify: agreement.certify ?? false,
      pdpa: agreement.pdpa ?? false,
      updated_at: new Date().toISOString(),
    };
    
    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .insert(applicationData)
      .select("id")
      .single();

    if (applicationError) throw applicationError;

    applicationId = application.id;

    /* ------------------------------------------------------------ */
    /*   ตั้งแต่ตรงนี้เป็นต้นไป: ถ้า error ต้อง cleanup ทุกอย่างที่ทำไปแล้ว    */
    /* ------------------------------------------------------------ */

    try {
      /* -------------------------------------------------------- */
      /*                2) Insert Child Tables ต่อ                   */
      /* -------------------------------------------------------- */
      
      if (payload.education?.length > 0) {
        const educationRows = payload.education.map((item: any) => ({
          application_id: applicationId,
          degree_level: item.degreeLevel,
          institution: item.institution,
          faculty: item.faculty,
          major: item.major,
          graduated_year: item.graduatedYear,
          gpa: item.gpa,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
          .from("recruit_job_education_history")
          .insert(educationRows);

        if (error) throw error;
      }

      if (payload.workExperience?.length > 0) {
        const workRows = payload.workExperience.map((item: any) => ({
          application_id: applicationId,
          period: item.period,
          company_name: item.companyName,
          position: item.position,
          latest_salary: item.latestSalary,
          reason_for_leaving: item.reasonForLeaving,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
          .from("recruit_job_work_experience")
          .insert(workRows);

        if (error) throw error;
      }

      if (payload.computerSkills?.length > 0) {
        const computerRows = payload.computerSkills.map((item: any) => ({
          application_id: applicationId,
          skill_type: "system_program",
          system_program: item.system_program,
          good: item.good,
          fair: item.fair,
          language: null,
          listening: null,
          speaking: null,
          reading: null,
          writing: null,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
          .from("recruit_job_skills")
          .insert(computerRows);

        if (error) throw error;
      }

      if (payload.languageSkills?.length > 0) {
        const languageRows = payload.languageSkills.map((item: any) => ({
          application_id: applicationId,
          skill_type: "language",
          language: item.language,
          listening: item.listening,
          speaking: item.speaking,
          reading: item.reading,
          writing: item.writing,
          system_program: null,
          good: null,
          fair: null,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
          .from("recruit_job_skills")
          .insert(languageRows);

        if (error) throw error;
      }

      /* -------------------------------------------------------- */
      /* 3) Upload Files โดยใช้ applicationId เป็นส่วนหนึ่งของ path   */
      /* -------------------------------------------------------- */

      const uploadedFiles: Record<string, { path: string; url: string }> = {};

      for (const document of payload.documents ?? []) {
        const file = formData?.get(document.id);

        if (!(file instanceof File)) continue;

        const uploaded = await uploadFileToSpaces(
          file,
          `job-applications/${applicationId}`
        );

        uploadedKeys.push(uploaded.key);   // เก็บไว้เผื่อต้อง rollback

        uploadedFiles[document.id] = {
          path: uploaded.key,
          url: uploaded.url,
        };
      }

      if (payload.documents?.length > 0) {
        const documentRows = payload.documents
          .filter((item: any) => uploadedFiles[item.id] !== undefined)
          .map((item: any) => ({
            application_id: applicationId,
            document_type: item.type,
            title: item.type === "other" ? item.title : null,
            file_name: item.fileName,
            file_path: uploadedFiles[item.id].path,
            file_url: uploadedFiles[item.id].url,
            updated_at: new Date().toISOString(),
          }));

        if (documentRows.length > 0) {
          const { error } = await supabaseAdmin
            .from("recruit_job_documents")
            .insert(documentRows);

          if (error) throw error;
        }
      }
    } catch (innerError) {
      /* -------------------------------------------------------- */
      /*              Cleanup: ลบไฟล์ + ลบ application record       */
      /* -------------------------------------------------------- */

      console.error(
        "Error after application insert, rolling back:",
        innerError
      );

      // ลบไฟล์ที่อัปโหลดไปแล้วทั้งหมด (ไม่ให้ error ตัวใดตัวหนึ่งขวางตัวอื่น)
      const deleteResults = await Promise.allSettled(
        uploadedKeys.map((key) => deleteFileFromSpaces(key))
      );

      deleteResults.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete uploaded file "${uploadedKeys[i]}" during rollback:`,
            result.reason
          );
        }
      });

      // ลบ application record ที่เพิ่ง insert ไป
      const { error: deleteAppError } = await supabaseAdmin
        .from("recruit_job_applications")
        .delete()
        .eq("id", applicationId);

      if (deleteAppError) {
        console.error(
          "Failed to delete application record during rollback:",
          deleteAppError
        );
      }

      // โยน error เดิมต่อ ให้ catch ชั้นนอกสุดจัดการ response
      throw innerError;
    }
    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully.",
        applicationId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Application API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Unable to submit application.",
      },
      { status: 500 }
    );
  }
}