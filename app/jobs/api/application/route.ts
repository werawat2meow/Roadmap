import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  uploadFileToSpaces,
  deleteFileFromSpaces,
} from "@/lib/spaces";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function validateDocumentFileSizes(
  documents: any[] | undefined,
  formData: FormData | null
): string | null {
  if (!documents || documents.length === 0 || !formData) return null;

  for (const document of documents) {
    const file = formData.get(document.id);

    if (!(file instanceof File)) continue;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const label = document.type ?? document.id;
      return `ไฟล์ "${file.name}" (${label}) มีขนาด ${sizeMB}MB เกินขนาดที่กำหนด (สูงสุด 2MB)`;
    }
  }

  return null;
}

function emptyToNull(value: unknown) {
  return value === "" || value === undefined ? null : value;
}

async function resolveRecruitmentOpening(
  positionId: string | number | null,
  requestedBranchId: string | number | null,
  requestedJobId: string | number | null
) {
  // ============================================================
  // กรณี 1 : มี jobId
  // ให้ยึด jobId เป็นอันดับแรก
  // ============================================================
  if (requestedJobId) {
    const { data: opening, error } = await supabaseAdmin
      .from("recruit_job_open")
      .select(`
        id,
        position_id,
        branch_id,
        branches (
          id,
          branch_name
        )
      `)
      .eq("id", requestedJobId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!opening) {
      throw new Error("The selected job opening is not available.");
    }

    return {
      jobId: opening.id,
      sourceBranchId: opening.branch_id ?? requestedBranchId ?? null,
    };
  }

  // ============================================================
  // กรณี 2 : ไม่มี jobId แต่มี source_branch_id
  // ค้นหาจาก position + branch
  // ============================================================
  if (requestedBranchId && positionId) {
    const { data: opening, error } = await supabaseAdmin
      .from("recruit_job_open")
      .select(`
        id,
        position_id,
        branch_id,
        branches (
          id,
          branch_name
        )
      `)
      .eq("position_id", positionId)
      .eq("branch_id", requestedBranchId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (opening) {
      return {
        jobId: opening.id,
        sourceBranchId: opening.branch_id,
      };
    }
  }

  // ============================================================
  // กรณี 3 : ไม่มี positionId
  // ============================================================
  if (!positionId) {
    return {
      jobId: null,
      sourceBranchId: requestedBranchId ?? null,
    };
  }

  // ============================================================
  // ไม่มีทั้ง jobId ที่ match และ branch ที่ match
  // ใช้ logic เดิม ตรวจสอบจาก position
  // ============================================================
  const { data: openings, error } = await supabaseAdmin
    .from("recruit_job_open")
    .select(`
      id,
      position_id,
      branch_id,
      branches (
        id,
        branch_name
      )
    `)
    .eq("position_id", positionId);

  if (error) {
    throw error;
  }

  const jobOpenings = openings ?? [];

  // ไม่มีรอบเปิดรับสมัคร
  if (jobOpenings.length === 0) {
    return {
      jobId: null,
      sourceBranchId: requestedBranchId ?? null,
    };
  }

  // มีรอบเดียว
  if (jobOpenings.length === 1) {
    const opening = jobOpenings[0];

    return {
      jobId: opening.id,
      sourceBranchId: opening.branch_id ?? null,
    };
  }

  // มีหลายรอบ แต่ไม่ได้ระบุ branch
  if (!requestedBranchId) {
    throw new Error("Please select a branch for this position.");
  }

  const selectedOpening = jobOpenings.find(
    (item) =>
      String(item.branch_id) === String(requestedBranchId)
  );

  if (!selectedOpening) {
    throw new Error(
      "The selected branch is not available for this position."
    );
  }

  return {
    jobId: selectedOpening.id,
    sourceBranchId: selectedOpening.branch_id,
  };
}

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

    // ✅ ตรวจสอบขนาดไฟล์ก่อนทำอะไรต่อ
    const sizeError = validateDocumentFileSizes(payload.documents, formData);
    if (sizeError) {
      return NextResponse.json(
        { success: false, message: sizeError },
        { status: 400 }
      );
    }
    
    const personal = payload.personal ?? {};
    const agreement = payload.agreement ?? {};
    const positionId = emptyToNull(
      payload.positionId ?? payload.position_id
    ) as string | number | null;

    const requestedBranchId = emptyToNull(
      payload.sourceBranchId ??
      payload.source_branch_id
    ) as string | number | null;

    const requestedJobId = emptyToNull(
      payload.jobId ??
      payload.job_id
    ) as string | number | null;

    // ============================================================
    // ตรวจสอบรอบเปิดรับสมัคร
    // ============================================================
    const {
      jobId,
      sourceBranchId,
    } = await resolveRecruitmentOpening(
      positionId,
      requestedBranchId,
      requestedJobId
    );

    /* ------------------------------------------------------------ */
    /*         1) Insert recruit_job_applications ก่อนอันดับแรก         */
    /* ------------------------------------------------------------ */

    const applicationData = {
      job_id: jobId,
      source_branch_id: sourceBranchId,
      position_id: positionId,
      other_position: personal.otherPosition ?? "",
      expected_salary: Number(personal.expectedSalary ?? payload.expected_salary ?? 0),
      title_id: emptyToNull(personal.title),
      first_name: personal.firstName ?? "",
      last_name: personal.lastName ?? "",
      nickname_th: personal.nicknameTH ?? "",
      nickname_en: personal.nicknameEN ?? "",
      date_of_birth: personal.dateOfBirth ?? "",
      age: Number(personal.age ?? 0),
      gender: emptyToNull(personal.gender),
      military_status: personal.militaryStatus ?? "",
      pregnancy_age: emptyToNull(personal.pregnancyAge),
      height: Number(personal.height ?? 0),
      weight: Number(personal.weight ?? 0),
      nationality: emptyToNull(personal.nationality),
      religion: emptyToNull(personal.religion),
      identity_no: personal.idCardNo ?? "",
      current_address_no: personal.addressNo ?? null,
      village_no: Number(personal.villageNo ?? 0),
      street: personal.street ?? "",
      sub_district: personal.subDistrict ?? "",
      district: personal.district ?? "",
      province: personal.province ?? "",
      province_id: emptyToNull(personal.provinceId),
      district_id: emptyToNull(personal.districtId),
      subdistrict_id: emptyToNull(personal.subDistrictId),
      postal_code: personal.postalCode ?? null,
      line_id: personal.lineId ?? "",
      email: personal.email ?? "",
      phone_number: personal.phoneNumber ?? "",
      residence_type: personal.residenceType ?? "",
      residence_other: personal.residenceOther ?? "",
      marital_status: personal.maritalStatus ?? "",
      children: emptyToNull(personal.children),
      driver_license: personal.driverLicense ?? null,
      emergency_name: personal.emergencyContact?.name ?? "",
      emergency_phone: personal.emergencyContact?.phone ?? "",
      emergency_relationship: personal.emergencyContact?.relationship ?? "",
      underlying_disease: personal.underlyingDisease ?? "",
      serious_crime: personal.criminalRecord ?? null,
      dishonest: personal.dishonestyRecord ?? null,
      certify: agreement.certify ?? false,
      pdpa: agreement.pdpa ?? false,
      from_social_media: agreement.from_social_media ?? null,
      self_presentation_url : payload.self_presentation_url,
      updated_at: new Date().toISOString(),
      status: 1,
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
    //   /* -------------------------------------------------------- */
    //   /*                2) Insert Child Tables ต่อ                   */
    //   /* -------------------------------------------------------- */
      
      const education =
        payload.education?.filter((item: any) => {
          return item.degreeLevel?.trim();
        }) ?? [];

      
      if (education.length > 0) {
        const educationRows = payload.education.map((item: any) => ({
          application_id: applicationId,
          degree_level: item.degreeLevel,
          institution: item.institution,
          faculty: item.faculty,
          major: item.major,
          graduated_year: Number(item.graduatedYear ?? 0),
          gpa: Number(item.gpa ?? 0),
          updated_at: new Date().toISOString(),
        }));
        
        const { error } = await supabaseAdmin
          .from("recruit_job_education_history")
          .insert(educationRows);
        if (error) throw error;
      }

      const workExperience =
        payload.workExperience?.filter((item: any) => {
          return item.period?.trim();
        }) ?? [];

      if (workExperience.length > 0) {
        const workRows = payload.workExperience.map((item: any) => ({
          application_id: applicationId,
          period: item.period,
          company_name: item.companyName,
          position: item.position,
          latest_salary: Number(item.latestSalary ?? 0),
          reason_for_leaving: item.reasonForLeaving,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
          .from("recruit_job_work_experience")
          .insert(workRows);
        if (error) throw error;
      }

      const computerSkills =
        payload.computerSkills?.filter((item: any) => {
          const isEmptyProgram = !item.system_program?.trim();
          const isEmptyGood = item.good === "" || item.good == null;
          const isEmptyFair = item.fair === "" || item.fair == null;

          return !(isEmptyProgram && isEmptyGood && isEmptyFair);
        }) ?? [];

      if (computerSkills.length > 0) {
        const computerRows = computerSkills.map((item: any) => ({
          application_id: applicationId,
          skill_type: "system_program",
          system_program: item.system_program?.trim() || null,
          good: item.good === "" ? null : Number(item.good),
          fair: item.fair === "" ? null : Number(item.fair),
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

      const languageSkills =
        payload.languageSkills?.filter((item: any) => {
          return item.language?.trim();
        }) ?? [];

      if (languageSkills.length > 0) {
        const languageRows = languageSkills.map((item: any) => ({
          application_id: applicationId,
          skill_type: "language",
          language: item.language.trim(),
          listening: item.listening == null || item.listening === "" ? null : Number(item.listening),
          speaking: item.speaking == null || item.speaking === "" ? null : Number(item.speaking),
          reading: item.reading == null || item.reading === "" ? null : Number(item.reading),
          writing: item.writing == null || item.writing === "" ? null : Number(item.writing),
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
          `job-recruitment/${applicationId}`
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



export async function PUT(request: NextRequest) {

  const uploadedKeys: string[] = [];

  try {

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

    // ✅ ตรวจสอบขนาดไฟล์ก่อนทำอะไรต่อ
    const sizeError = validateDocumentFileSizes(payload.documents, formData);
    if (sizeError) {
      return NextResponse.json(
        { success: false, message: sizeError },
        { status: 400 }
      );
    }
    
    const personal = payload.personal ?? {};
    const agreement = payload.agreement ?? {};
    const positionId = emptyToNull(
      payload.positionId ?? payload.position_id
    ) as string | number | null;

    const requestedBranchId = emptyToNull(
      payload.sourceBranchId ??
      payload.source_branch_id
    ) as string | number | null;

    const requestedJobId = emptyToNull(
      payload.jobId ??
      payload.job_id
    ) as string | number | null;


    const applicationId = payload.application_id;

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing application id.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // ตรวจสอบ recruit_job_open ใหม่ทุกครั้ง
    // ============================================================
    const {
      jobId,
      sourceBranchId,
    } = await resolveRecruitmentOpening(
      positionId,
      requestedBranchId,
      requestedJobId
    );

    // API เป็นผู้กำหนด status
    const status = 1;

    const applicationData = {
      position_id: positionId,
      job_id: jobId,
      source_branch_id: sourceBranchId,
      other_position: personal.otherPosition ?? "",
      expected_salary: Number( personal.expectedSalary ?? payload.expected_salary ?? 0),
      first_name: personal.firstName ?? "",
      last_name: personal.lastName ?? "",
      nickname_th: personal.nicknameTH ?? "",
      nickname_en: personal.nicknameEN ?? "",
      date_of_birth: personal.dateOfBirth ?? "",
      age: Number(personal.age ?? 0),
      gender: emptyToNull(personal.gender),
      military_status: personal.militaryStatus ?? "",
      pregnancy_age: emptyToNull(personal.pregnancyAge),
      height: Number(personal.height ?? 0),
      weight: Number(personal.weight ?? 0),
      nationality: emptyToNull(personal.nationality),
      religion: emptyToNull(personal.religion),
      identity_no: personal.idCardNo ?? "",
      current_address_no: personal.addressNo ?? null,
      village_no: Number(personal.villageNo ?? 0),
      street: personal.street ?? "",
      sub_district: personal.subDistrict ?? "",
      district: personal.district ?? "",
      province: personal.province ?? "",
      province_id: emptyToNull(personal.provinceId),
      district_id: emptyToNull(personal.districtId),
      subdistrict_id: emptyToNull(personal.subDistrictId),
      postal_code: personal.postalCode ?? null,
      line_id: personal.lineId ?? "",
      email: personal.email ?? "",
      phone_number: personal.phoneNumber ?? "",
      residence_type: personal.residenceType ?? "",
      residence_other: personal.residenceOther ?? "",
      marital_status: personal.maritalStatus ?? "",
      children: emptyToNull(personal.children),
      driver_license: personal.driverLicense ?? null,
      emergency_name: personal.emergencyContact?.name ?? "",
      emergency_phone: personal.emergencyContact?.phone ?? "",
      emergency_relationship: personal.emergencyContact?.relationship ?? "",
      underlying_disease: personal.underlyingDisease ?? "",
      serious_crime: personal.criminalRecord ?? null,
      dishonest: personal.dishonestyRecord ?? null,
      certify: agreement.certify ?? false,
      pdpa: agreement.pdpa ?? false,
      from_social_media: agreement.from_social_media ?? null,
      self_presentation_url: payload.self_presentation_url ?? null,

      // API เป็นผู้กำหนด status
      status,

      updated_at: new Date().toISOString(),
    };

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .update(applicationData)
      .eq("id", applicationId)
      .select("id")
      .single();

    if (applicationError) {
      throw applicationError;
    }

    try {
    //   /* -------------------------------------------------------- */
    //   /*                2) Insert Child Tables ต่อ                   */
    //   /* -------------------------------------------------------- */
      
      const education =
        payload.education?.filter((item: any) => {
          return item.degreeLevel?.trim();
        }) ?? [];

      
      if (education.length > 0) {
        const educationRows = payload.education.map((item: any) => ({
          application_id: applicationId,
          degree_level: item.degreeLevel,
          institution: item.institution,
          faculty: item.faculty,
          major: item.major,
          graduated_year: Number(item.graduatedYear ?? 0),
          gpa: Number(item.gpa ?? 0),
          updated_at: new Date().toISOString(),
        }));
        
        const { error } = await supabaseAdmin
          .from("recruit_job_education_history")
          .insert(educationRows);
        if (error) throw error;
      }

      const workExperience =
        payload.workExperience?.filter((item: any) => {
          return item.period?.trim();
        }) ?? [];

      if (workExperience.length > 0) {
        const workRows = payload.workExperience.map((item: any) => ({
          application_id: applicationId,
          period: item.period,
          company_name: item.companyName,
          position: item.position,
          latest_salary: Number(item.latestSalary ?? 0),
          reason_for_leaving: item.reasonForLeaving,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabaseAdmin
          .from("recruit_job_work_experience")
          .insert(workRows);
        if (error) throw error;
      }

      const computerSkills =
        payload.computerSkills?.filter((item: any) => {
          const isEmptyProgram = !item.system_program?.trim();
          const isEmptyGood = item.good === "" || item.good == null;
          const isEmptyFair = item.fair === "" || item.fair == null;

          return !(isEmptyProgram && isEmptyGood && isEmptyFair);
        }) ?? [];

      if (computerSkills.length > 0) {
        const computerRows = computerSkills.map((item: any) => ({
          application_id: applicationId,
          skill_type: "system_program",
          system_program: item.system_program?.trim() || null,
          good: item.good === "" ? null : Number(item.good),
          fair: item.fair === "" ? null : Number(item.fair),
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

      const languageSkills =
        payload.languageSkills?.filter((item: any) => {
          return item.language?.trim();
        }) ?? [];

      if (languageSkills.length > 0) {
        const languageRows = languageSkills.map((item: any) => ({
          application_id: applicationId,
          skill_type: "language",
          language: item.language.trim(),
          listening: item.listening == null || item.listening === "" ? null : Number(item.listening),
          speaking: item.speaking == null || item.speaking === "" ? null : Number(item.speaking),
          reading: item.reading == null || item.reading === "" ? null : Number(item.reading),
          writing: item.writing == null || item.writing === "" ? null : Number(item.writing),
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
          `job-recruitment/${applicationId}`
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
        message: "Application updated successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Application UPDATE API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Unable to update application.",
      },
      { status: 500 }
    );
  }
}