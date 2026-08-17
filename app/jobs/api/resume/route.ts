import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { uploadFileToSpaces, deleteFileFromSpaces } from "@/app/jobs/lib/spaces";

interface UploadedFile {
  fileName: string;
  key: string;
  url: string;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const ALLOWED_EXTENSIONS = /\.(pdf|docx?|png|jpe?g)$/i;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Basic check for Thai mobile / general phone numbers (7-15 digits, optional +)
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export async function POST(request: NextRequest) {
  let applicationId: string | number | null = null;
  let uploadedFile: UploadedFile | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    let payload: any;
    try {
      payload = JSON.parse(formData.get("data") as string);
    } catch {
      return NextResponse.json(
        { success: false, message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // /* ---------------------------------------------------------------------- */
    // /* File Validation                                                       */
    // /* ---------------------------------------------------------------------- */

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "ไม่พบไฟล์ Resume" },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_MIME_TYPES.includes(file.type) &&
      !ALLOWED_EXTENSIONS.test(file.name)
    ) {
      return NextResponse.json(
        { success: false, message: "รองรับเฉพาะ PDF DOC DOCX PNG JPG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ต้องไม่เกิน 20MB" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // /* ---------------------------------------------------------------------- */
    // /* Extract & Normalize Payload                                           */
    // /* ---------------------------------------------------------------------- */

    const first_name = typeof payload.first_name === "string" ? payload.first_name.trim() : "";
    const last_name = typeof payload.last_name === "string" ? payload.last_name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const line_id = typeof payload.line_id === "string" ? payload.line_id.trim() : "";
    const phone_number = typeof payload.phone_number === "string" ? payload.phone_number.trim() : "";
    const other_position = typeof payload.other_position === "string" ? payload.other_position.trim() : "";
    const expected_salary = payload.expected_salary;
    const certify = payload.certify;
    const pdpa = payload.pdpa;
    const from_social_media = typeof payload.from_social_media === "string" ? payload.from_social_media.trim() : "";
    const self_presentation_url = typeof payload.self_presentation_url === "string" ? payload.self_presentation_url.trim() : "";

    // /* ---------------------------------------------------------------------- */
    // /* Validation                                                            */
    // /* ---------------------------------------------------------------------- */

    if (!first_name || !last_name || !email || !phone_number) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลผู้สมัครไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!PHONE_REGEX.test(phone_number.replace(/[-\s]/g, ""))) {
      return NextResponse.json(
        { success: false, message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // certify / pdpa must be actual booleans set to true, not just truthy strings
    if (certify !== true || pdpa !== true) {
      return NextResponse.json(
        { success: false, message: "กรุณายืนยันข้อมูลและ PDPA" },
        { status: 400 }
      );
    }

    let normalizedSalary: number | null = null;
    if (expected_salary !== undefined && expected_salary !== null && expected_salary !== "") {
      const parsedSalary = Number(expected_salary);
      if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
        return NextResponse.json(
          { success: false, message: "เงินเดือนที่คาดหวังไม่ถูกต้อง" },
          { status: 400 }
        );
      }
      normalizedSalary = parsedSalary;
    }

    // /* ---------------------------------------------------------------------- */
    // /* Insert Application                                                    */
    // /* ---------------------------------------------------------------------- */

    const { data: application, error: applicationError } = await supabaseAdmin
      .from("recruit_job_applications")
      .insert({
        other_position: other_position || null,
        expected_salary: normalizedSalary,
        first_name,
        last_name,
        email,
        line_id: line_id || null,
        phone_number,
        certify,
        pdpa,
        from_social_media: from_social_media || null,
        self_presentation_url: self_presentation_url || null,
        status: 16,
      })
      .select("id")
      .single();

    if (applicationError) {
      console.error("Insert application error:", applicationError);
      return NextResponse.json(
        { success: false, message: "ไม่สามารถบันทึกข้อมูลผู้สมัครได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    applicationId = application.id;

    // /* ---------------------------------------------------------------------- */
    // /* Upload Resume File                                                    */
    // /* ---------------------------------------------------------------------- */

    try {
      uploadedFile = await uploadFileToSpaces(file, `job-recruitment/resume/${applicationId}`);
    } catch (error: any) {
      console.error("Upload file error:", error);

      // Roll back the application record since the resume upload failed
      await supabaseAdmin
        .from("recruit_job_applications")
        .delete()
        .eq("id", applicationId);

      return NextResponse.json(
        { success: false, message: "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    // /* ---------------------------------------------------------------------- */
    // /* Insert Document                                                       */
    // /* ---------------------------------------------------------------------- */

    const { error: documentError } = await supabaseAdmin
      .from("recruit_job_documents")
      .insert({
        application_id: applicationId,
        document_type: "other",
        title: "Resume",
        file_name: uploadedFile.fileName,
        file_path: uploadedFile.key,
        file_url: uploadedFile.url,
      });

    if (documentError) {
      console.error("Insert document error:", documentError);

      // Roll back both the application record and the uploaded file
      await supabaseAdmin
        .from("recruit_job_applications")
        .delete()
        .eq("id", applicationId);

      await deleteFileFromSpaces(uploadedFile.key);

      return NextResponse.json(
        { success: false, message: "ไม่สามารถบันทึกไฟล์ Resume ได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    // /* ---------------------------------------------------------------------- */
    // /* Success                                                               */
    // /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        data: { application_id: applicationId },
        message: "Resume submitted successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Resume API error:", error);

    // Best-effort cleanup if something unexpected happened after the
    // application row and/or file were created but before we returned.
    if (applicationId) {
      await supabaseAdmin
        .from("recruit_job_applications")
        .delete()
        .eq("id", applicationId)
        .then(undefined, (e) => console.error("Cleanup application failed:", e));
    }
    if (uploadedFile?.key) {
      await deleteFileFromSpaces(uploadedFile.key).catch((e) =>
        console.error("Cleanup file failed:", e)
      );
    }

    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}