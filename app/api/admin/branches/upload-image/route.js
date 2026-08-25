import {
  NextResponse,
} from "next/server";

import {
  uploadFileToSpaces,
} from "@/app/jobs/lib/spaces";

/* =========================================================
   POST
   Upload Branch Image -> DigitalOcean Spaces

   Bucket:
   DO_SPACES_BUCKET=hw1

   Folder:
   Employees/
========================================================= */

export async function POST(req) {
  try {
    const formData =
      await req.formData();

    const file =
      formData.get("file");

    const branchId =
      String(
        formData.get(
          "branchId"
        ) || ""
      ).trim();

    /* =====================================================
       Validate File
    ===================================================== */

    if (
      !file ||
      typeof file === "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบไฟล์รูปภาพสังกัด",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       Validate File Type
    ===================================================== */

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รองรับเฉพาะไฟล์ JPG, PNG, WEBP",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       Validate File Size
    ===================================================== */

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       Extension
    ===================================================== */

    const ext =
      file.name
        ?.split(".")
        .pop()
        ?.toLowerCase() ||
      file.type
        ?.split("/")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const safeBranchId =
      branchId || "temp";

    /* =====================================================
       File Name

       ตัวอย่าง:
       branch-UUID-1787200000000.webp
    ===================================================== */

    const fileName =
      `branch-${safeBranchId}-${Date.now()}.${ext}`;

    /* =====================================================
       Upload -> DigitalOcean Spaces

       Bucket:
       hw1

       Folder:
       Branches/
    ===================================================== */

    const uploaded =
      await uploadFileToSpaces(
        file,
        "Branches",
        fileName
      );

    /* =====================================================
       Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "อัปโหลดรูปสังกัดสำเร็จ",

      url:
        uploaded.url || "",

      path:
        uploaded.key || "",

      fileName:
        uploaded.fileName ||
        fileName,
    });
  } catch (error) {
    console.error(
      "UPLOAD_BRANCH_IMAGE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถอัปโหลดรูปสังกัดได้",
      },
      {
        status: 500,
      }
    );
  }
}