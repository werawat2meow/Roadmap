import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// ---------- Env validation ----------
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const DO_SPACES_REGION = requireEnv("DO_SPACES_REGION");
const DO_SPACES_ENDPOINT = requireEnv("DO_SPACES_ENDPOINT");
const DO_SPACES_KEY = requireEnv("DO_SPACES_KEY");
const DO_SPACES_SECRET = requireEnv("DO_SPACES_SECRET");
const BUCKET = requireEnv("DO_SPACES_BUCKET");

export const spacesClient = new S3Client({
  region: DO_SPACES_REGION,
  endpoint: DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: DO_SPACES_KEY,
    secretAccessKey: DO_SPACES_SECRET,
  },
});

// ---------- Helpers ----------

/**
 * กัน path traversal / อักขระอันตราย โดยอนุญาตเฉพาะ a-z A-Z 0-9 . _ -
 * อักขระอื่น (รวมถึง / และภาษาไทย) จะถูกแทนที่ด้วย "_"
 */
function sanitizeSegment(segment: string): string {
  return segment
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "") // กัน hidden file / ".." ที่ขึ้นต้นด้วยจุด
    .slice(0, 200); // กันชื่อยาวเกินไป
}

/**
 * หา extension จากชื่อไฟล์อย่างปลอดภัย
 * "photo.jpg" -> "jpg"
 * "README"    -> ""
 * ".env"      -> "" (ไม่ถือว่า .env เป็น extension ของ "" )
 */
function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length <= 1) return "";
  return parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildPublicUrl(key: string): string {
  // Virtual-hosted-style URL ตามรูปแบบมาตรฐานของ DigitalOcean Spaces
  // เช่น https://my-bucket.sgp1.digitaloceanspaces.com/path/to/file.jpg
  const endpointHost = DO_SPACES_ENDPOINT.replace(/^https?:\/\//, "");
  return `https://${BUCKET}.${endpointHost}/${key}`;
}

// ---------- Upload ----------

export async function uploadFileToSpaces(
  file: File,
  folder = "job-recruitment",
  customFileName?: string
) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeFolder = sanitizeSegment(folder);
  const extension = getExtension(file.name);

  const baseName = customFileName
    ? sanitizeSegment(customFileName)
    : randomUUID();

  const fileName = extension ? `${baseName}.${extension}` : baseName;

  const key = `${safeFolder}/${fileName}`;

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      ACL: "public-read",
    })
  );

  return {
    key,
    fileName,
    url: buildPublicUrl(key),
  };
}

export async function uploadMultipleFiles(
  files: {
    type: string;
    file: File;
  }[]
) {
  // อัปโหลดพร้อมกันเพื่อความเร็ว
  // หมายเหตุ: ถ้าไฟล์ใดไฟล์หนึ่ง fail, Promise.all จะ reject ทันที
  // และไฟล์อื่นที่อัปโหลดสำเร็จแล้วจะไม่ถูก rollback อัตโนมัติ
  const results = await Promise.all(
    files.map(async (item) => {
      const result = await uploadFileToSpaces(item.file, item.type);
      return {
        type: item.type,
        path: result.key,
        url: result.url,
        fileName: result.fileName,
      };
    })
  );

  return results;
}

// ---------- Delete ----------

export async function deleteFileFromSpaces(key: string) {
  await spacesClient.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

// ---------- Copy ----------

export async function copyFileInSpaces(
  sourcePath: string,
  destinationPath: string
) {
  const command = new CopyObjectCommand({
    Bucket: BUCKET,
    // ไฟล์ต้นฉบับ (ต้อง URL-encode กันเคส path มีอักขระพิเศษ/เว้นวรรค)
    CopySource: `${BUCKET}/${encodeURIComponent(sourcePath).replace(
      /%2F/g,
      "/"
    )}`,
    // ไฟล์ปลายทาง
    Key: destinationPath,
  });

  const result = await spacesClient.send(command);

  return result;
}

export async function copyMultipleFilesInSpaces(
  files: {
    sourcePath: string;
    destinationPath: string;
  }[]
) {
  const results = await Promise.allSettled(
    files.map((file) =>
      copyFileInSpaces(file.sourcePath, file.destinationPath)
    )
  );

  const copied: {
    sourcePath: string;
    destinationPath: string;
    etag?: string;
  }[] = [];

  const failed: { sourcePath: string; destinationPath: string; error: string }[] =
    [];

  results.forEach((result, index) => {
    const file = files[index];
    if (result.status === "fulfilled") {
      copied.push({
        sourcePath: file.sourcePath,
        destinationPath: file.destinationPath,
        etag: result.value.CopyObjectResult?.ETag,
      });
    } else {
      failed.push({
        sourcePath: file.sourcePath,
        destinationPath: file.destinationPath,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  });

  if (failed.length > 0) {
    console.error("Some files failed to copy:", failed);
  }

  return { copied, failed };
}