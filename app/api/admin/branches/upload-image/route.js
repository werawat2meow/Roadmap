import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const branchId = String(formData.get("branchId") || "").trim();

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "ไม่พบไฟล์รูปภาพสังกัด" },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_BRANCH_BUCKET || "branch-images";

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "รองรับเฉพาะไฟล์ JPG, PNG, WEBP" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext =
      file.name?.split(".").pop()?.toLowerCase() ||
      file.type?.split("/").pop()?.toLowerCase() ||
      "jpg";

    const safeBranchId = branchId || "temp";
    const fileName = `branch-${Date.now()}.${ext}`;
    const filePath = `branches/${safeBranchId}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      message: "อัปโหลดรูปสังกัดสำเร็จ",
      url: publicUrlData?.publicUrl || "",
      path: filePath,
      bucket,
    });
  } catch (error) {
    console.error("UPLOAD_BRANCH_IMAGE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัปโหลดรูปสังกัดได้",
      },
      { status: 500 }
    );
  }
}