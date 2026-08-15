import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { uploadFileToSpaces, deleteFileFromSpaces } from "@/app/jobs/lib/spaces";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const applicationId = formData.get("application_id");
    const file = formData.get("file");

    if (!applicationId) {
      return NextResponse.json(
        { error: "application_id is required" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    // =====================================================
    // ตรวจสอบประเภทไฟล์
    // =====================================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "รองรับเฉพาะ JPG และ PNG",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // ตรวจสอบขนาดไฟล์
    // =====================================================

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "รูปภาพต้องมีขนาดไม่เกิน 2MB",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // ตรวจสอบ Application
    // =====================================================

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .select("id, status, profile_image_url")
        .eq("id", applicationId)
        .single();

    if (applicationError || !application) {
      return NextResponse.json(
        {
          error: "ไม่พบข้อมูลผู้สมัคร",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // อนุญาตเฉพาะ status = 5
    // =====================================================

    if (application.status !== 5) {
      return NextResponse.json(
        {
          error:
            "สามารถอัปเดตรูปได้เฉพาะผู้สมัครที่มีสถานะ 5 เท่านั้น",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // กำหนด extension
    // =====================================================

    const extension = file.type === "image/png"? "png": "jpg";

    const folder =`job-recruitment/${applicationId}/profile`;

    const fileName =`profile_${applicationId}.${extension}`;

    const filePath =`${folder}/${fileName}`;

    // =====================================================
    // ลบไฟล์เก่าทั้ง JPG และ PNG
    // =====================================================

    const oldJpgKey = `${folder}/profile_${applicationId}.jpg`;

    const oldPngKey = `${folder}/profile_${applicationId}.png`;

    try {
      await deleteFileFromSpaces(oldJpgKey);
    } catch (error) {
      console.warn(
        "ไม่พบไฟล์ JPG เดิม หรือไม่สามารถลบได้:",
        error
      );
    }

    try {
      await deleteFileFromSpaces(oldPngKey);
    } catch (error) {
      console.warn(
        "ไม่พบไฟล์ PNG เดิม หรือไม่สามารถลบได้:",
        error
      );
    }

    // =====================================================
    // Upload รูปใหม่
    // =====================================================

    const uploadResult =
      await uploadFileToSpaces(
        file,
        folder,
        fileName
      );

    if (!uploadResult?.url) {
      return NextResponse.json(
        {
          error:
            "ไม่สามารถอัปโหลดรูปไปยัง DigitalOcean Spaces ได้",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Update Database
    // =====================================================

    const { error: updateError } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .update({
          profile_image_url: uploadResult.url,
        })
        .eq("id", applicationId);

    if (updateError) {
      console.error(
        "Update profile_image_url error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "อัปโหลดรูปสำเร็จ แต่ไม่สามารถบันทึกข้อมูลได้",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Success
    // =====================================================

    return NextResponse.json({
      success: true,
      message: "อัปเดตรูปผู้สมัครเรียบร้อย",
      path: uploadResult.key,
      fileName: uploadResult.fileName,
      url: uploadResult.url,
    });
  } catch (error) {
    console.error(
      "update applicant photo error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "เกิดข้อผิดพลาดในการอัปโหลดรูป",
      },
      { status: 500 }
    );
  }
}