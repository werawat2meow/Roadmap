import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  uploadFileToSpaces,
} from "@/app/jobs/lib/spaces";

/* =========================================================
   Runtime
   sharp ต้องทำงานฝั่ง Node.js
========================================================= */

export const runtime = "nodejs";

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

/*
 * Employee Profile Standard
 */
const PROFILE_WIDTH = 500;
const PROFILE_HEIGHT = 500;

const WEBP_QUALITY = 82;

/* =========================================================
   Helpers
========================================================= */

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
       4. Validate Original File Size
    ===================================================== */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไฟล์รูปต้นฉบับต้องมีขนาดไม่เกิน 5 MB",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       5. Read Original File
    ===================================================== */

    const originalBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /* =====================================================
       6. Resize + Optimize

       - rotate() แก้ Orientation จาก EXIF
       - resize 500 × 500
       - cover ตัดส่วนเกินให้เป็นสี่เหลี่ยม
       - convert WebP
       - quality 82
    ===================================================== */

    const optimizedBuffer =
      await sharp(
        originalBuffer
      )
        .rotate()
        .resize(
          PROFILE_WIDTH,
          PROFILE_HEIGHT,
          {
            fit: "cover",
            position:
              "centre",
          }
        )
        .webp({
          quality:
            WEBP_QUALITY,

          effort: 4,
        })
        .toBuffer();

    /* =====================================================
       7. File Name

       หลัง Optimize ทุกไฟล์เป็น .webp
    ===================================================== */

    const safeEmployeeId =
      sanitizeFilePart(
        employeeId
      ) || "temp";

    const fileName =
      `profile-${safeEmployeeId}-${Date.now()}.webp`;

    /* =====================================================
       8. Build File สำหรับ Spaces Helper

       uploadFileToSpaces()
       ของเดิมรับ File
    ===================================================== */

    const optimizedFile =
      new File(
        [
          optimizedBuffer,
        ],
        fileName,
        {
          type:
            "image/webp",
        }
      );

    /* =====================================================
       9. Upload DigitalOcean Spaces

       Result:
       Employees/profile-xxx.webp
    ===================================================== */

    const uploaded =
      await uploadFileToSpaces(
        optimizedFile,
        EMPLOYEE_FOLDER,
        fileName
      );

    /* =====================================================
       10. Normalize Result
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
       11. Response
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        "อัปโหลดรูปพนักงานสำเร็จ",
      url:publicUrl,
      path:filePath,
      folder:EMPLOYEE_FOLDER,
      image: {
        width:
          PROFILE_WIDTH,
        height:
          PROFILE_HEIGHT,
        format:
          "webp",
        quality:
          WEBP_QUALITY,
        original_size:
          file.size,
        optimized_size:
          optimizedBuffer.length,
        saved_size:
          Math.max(
            file.size -
              optimizedBuffer.length,
            0
          ),
      },
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
