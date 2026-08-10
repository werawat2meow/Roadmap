import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { randomUUID } from "crypto";

export const spacesClient = new S3Client({
  region: process.env.DO_SPACES_REGION!,
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey:
      process.env.DO_SPACES_SECRET!,
  },
});

const BUCKET = process.env.DO_SPACES_BUCKET!;

export async function uploadFileToSpaces(
  file: File,
  folder = "job-recruitment"
) {
  
  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const extension =
    file.name.split(".").pop() ?? "";

  const fileName = `${randomUUID()}.${extension}`;

  const key = `${folder}/${fileName}`;

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    })
  );

  return {
    key,
    fileName,
    url: `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${key}`,
  };
}

export async function uploadMultipleFiles(
  files: {
    type: string;
    file: File;
  }[]
) {
  const uploaded = [];

  for (const item of files) {
    const result =
      await uploadFileToSpaces(
        item.file,
        item.type
      );

    uploaded.push({
      type: item.type,
      path: result.key,
      url: result.url,
      fileName: result.fileName,
    });
  }

  return uploaded;
}

export async function deleteFileFromSpaces(
    key: string
) {
    await spacesClient.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        })
    );
}