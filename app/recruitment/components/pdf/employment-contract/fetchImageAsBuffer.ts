import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

type SupportedImageContentType = "image/jpeg" | "image/png";
type SourceImageContentType = SupportedImageContentType | "image/webp";

export interface FetchedContractImage {
  buffer: Buffer;
  contentType: SupportedImageContentType;
}

export interface FetchContractImageOptions {
  timeoutMs?: number;
  maxBytes?: number;
}

function normalizeContentType(value: string | null): SourceImageContentType | null {
  const contentType = value?.split(";", 1)[0]?.trim().toLowerCase();

  if (contentType === "image/jpeg" || contentType === "image/jpg") {
    return "image/jpeg";
  }
  if (contentType === "image/png") return "image/png";
  if (contentType === "image/webp") return "image/webp";

  return null;
}

function detectContentType(buffer: Buffer): SourceImageContentType | null {
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (isPng) return "image/png";

  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
  if (isJpeg) return "image/jpeg";

  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return isWebp ? "image/webp" : null;
}

async function prepareImage(
  buffer: Buffer,
  declaredContentType: string | null,
  maxBytes: number,
): Promise<FetchedContractImage | null> {
  if (buffer.length === 0 || buffer.length > maxBytes) return null;

  const declared = normalizeContentType(declaredContentType);
  const detected = detectContentType(buffer);
  if (!detected || (declared && declared !== detected)) return null;

  if (detected === "image/webp") {
    try {
      const { default: sharp } = await import("sharp");
      const convertedBuffer = await sharp(buffer, {
        failOn: "error",
        limitInputPixels: 40_000_000,
      })
        .png({ compressionLevel: 9 })
        .toBuffer();

      if (convertedBuffer.length === 0 || convertedBuffer.length > maxBytes) {
        return null;
      }

      return { buffer: convertedBuffer, contentType: "image/png" };
    } catch {
      return null;
    }
  }

  return { buffer, contentType: detected };
}

async function fetchRemoteImage(
  source: string,
  timeoutMs: number,
  maxBytes: number,
): Promise<FetchedContractImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(source, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return prepareImage(buffer, response.headers.get("content-type"), maxBytes);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function readDataUri(
  source: string,
  maxBytes: number,
): Promise<FetchedContractImage | null> {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    source,
  );
  if (!match) return null;

  try {
    const buffer = Buffer.from(match[2], "base64");
    return prepareImage(buffer, match[1], maxBytes);
  } catch {
    return null;
  }
}

async function readPublicImage(
  source: string,
  maxBytes: number,
): Promise<FetchedContractImage | null> {
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relativePath = source.replace(/^\/+/, "");
  const resolvedPath = path.resolve(publicDirectory, relativePath);

  if (
    resolvedPath !== publicDirectory &&
    !resolvedPath.startsWith(`${publicDirectory}${path.sep}`)
  ) {
    return null;
  }

  try {
    const buffer = await readFile(resolvedPath);
    return prepareImage(buffer, null, maxBytes);
  } catch {
    return null;
  }
}

/**
 * Server-only helper for contract logos. It accepts an http(s) URL, data URI,
 * or a path below /public. WebP input is converted to PNG for React PDF.
 * Invalid, oversized, timed-out, or unreadable images resolve to null so PDF
 * generation can continue without a logo.
 */
export async function fetchImageAsBuffer(
  source: string | null | undefined,
  options: FetchContractImageOptions = {},
): Promise<FetchedContractImage | null> {
  if (!source?.trim()) return null;

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const normalizedSource = source.trim();

  if (normalizedSource.startsWith("data:")) {
    return readDataUri(normalizedSource, maxBytes);
  }

  try {
    const url = new URL(normalizedSource);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return fetchRemoteImage(url.toString(), timeoutMs, maxBytes);
    }
    return null;
  } catch {
    return readPublicImage(normalizedSource, maxBytes);
  }
}

export async function fetchImageAsDataUri(
  source: string | null | undefined,
  options?: FetchContractImageOptions,
): Promise<string | null> {
  const image = await fetchImageAsBuffer(source, options);

  if (!image) return null;

  return `data:${image.contentType};base64,${image.buffer.toString("base64")}`;
}
