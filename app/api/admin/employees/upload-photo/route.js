import { NextResponse } from "next/server";

import {
  uploadFileToSpaces,
} from "@/app/jobs/lib/spaces";

/* =========================================================
   Constants
========================================================= */

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const EMPLOYEE_FOLDER =
  "Employees";

/* =========================================================
   Helpers
========================================================= */

function getFileExtension(
  file
) {
  const typeMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  if (typeMap[file?.type]) {
    return typeMap[file.type];
  }

  const extension =
    file?.name
      ?.split(".")
      ?.pop()
      ?.toLowerCase();

  return (
    extension ||
    "jpg"
  );
}

function sanitizeFilePart(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
}

/* =========================================================
   POST
   /api/admin/employees/upload-photo
========================================================= */

export async function POST(
  req
) {
  try {
    /* =====================================================
       1. Form Data
    ===================================================== */

    const formData =
      await req.formData();

    const file =
      formData.get(
        "file"
      );

    const employeeId =
      String(
        formData.get(
          "employeeId"
        ) || ""
      ).trim();

    /* =====================================================
       2. Validate File
    ===================================================== */

    if (
      !file ||
      typeof file ===
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบไฟล์รูปภาพ",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. Validate File Type
    ===================================================== */

    if (
      !ALLOWED_TYPES.includes(
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
       4. Validate File Size

       ไม่ Compress File
       จำกัดไฟล์ต้นฉบับไม่เกิน 5 MB
    ===================================================== */

    if (
      file.size >
      MAX_FILE_SIZE
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
       5. Build File Name
    ===================================================== */

    const ext =
      getFileExtension(
        file
      );

    const safeEmployeeId =
      sanitizeFilePart(
        employeeId
      ) || "temp";

    const fileName =
      `profile-${safeEmployeeId}-${Date.now()}.${ext}`;

    /*
     * ตัวอย่าง:
     *
     * Employees/
     *   profile-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-1787....jpg
     *
     * หรือถ้ายังไม่มี employeeId:
     *
     * Employees/
     *   profile-temp-1787....jpg
     */

    /* =====================================================
       6. Upload To DigitalOcean Spaces

       สำคัญ:
       - ไม่ resize
       - ไม่ compress
       - ไม่ convert format
       - Upload File เดิมตรง ๆ
    ===================================================== */

    const uploaded =
      await uploadFileToSpaces(
        file,
        EMPLOYEE_FOLDER,
        fileName
      );

    /* =====================================================
       7. Normalize Result
    ===================================================== */

    const filePath =
      uploaded?.key ||
      uploaded?.path ||
      `${EMPLOYEE_FOLDER}/${fileName}`;

    const publicUrl =
      uploaded?.url ||
      uploaded?.publicUrl ||
      "";

    if (!publicUrl) {
      throw new Error(
        "Upload สำเร็จแต่ไม่พบ URL ของไฟล์"
      );
    }

    /* =====================================================
       8. Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "อัปโหลดรูปพนักงานสำเร็จ",

      url:
        publicUrl,

      path:
        filePath,

      folder:
        EMPLOYEE_FOLDER,
    });
  } catch (error) {
    console.error(
      "UPLOAD_EMPLOYEE_PHOTO_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถอัปโหลดรูปพนักงานได้",
      },
      {
        status: 500,
      }
    );
  }
}