import {
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import {
  NextResponse,
} from "next/server";

const spacesClient =
  new S3Client({
    region:
      process.env.DO_SPACES_REGION,

    endpoint:
      process.env.DO_SPACES_ENDPOINT,

    credentials: {
      accessKeyId:
        process.env.DO_SPACES_KEY,

      secretAccessKey:
        process.env.DO_SPACES_SECRET,
    },
  });

const BUCKET =
  process.env.DO_SPACES_BUCKET;

/* =========================================================
   Convert stream -> Buffer
========================================================= */

async function streamToBuffer(
  stream
) {
  const chunks = [];

  for await (
    const chunk of stream
  ) {
    chunks.push(
      Buffer.from(chunk)
    );
  }

  return Buffer.concat(
    chunks
  );
}

/* =========================================================
   GET /api/admin/spaces-image?key=Branches/xxx.jpg
========================================================= */

export async function GET(req) {
  try {
    const {
      searchParams,
    } =
      new URL(req.url);

    const key =
      String(
        searchParams.get("key") ||
          ""
      )
        .trim()
        .replace(/^\/+/, "");

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ key ของรูปภาพ",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ป้องกัน Path ที่ไม่ต้องการ
     * Export Matrix ใช้เฉพาะรูป Branch
     */
    if (
      !key.startsWith(
        "Branches/"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่อนุญาตให้เข้าถึงไฟล์นี้",
        },
        {
          status: 403,
        }
      );
    }

    const command =
      new GetObjectCommand({
        Bucket:
          BUCKET,
        Key:
          key,
      });

    const result =
      await spacesClient.send(
        command
      );

    const buffer =
      await streamToBuffer(
        result.Body
      );

    return new NextResponse(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            result.ContentType ||
            "image/jpeg",

          "Cache-Control":
            "private, max-age=300",
        },
      }
    );
  } catch (error) {
    console.error(
      "SPACES_IMAGE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดรูปภาพได้",
      },
      {
        status: 500,
      }
    );
  }
}